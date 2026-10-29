// Adapter för Algolia Search. Det här är den enda filen som "vet om" Algolia
// Två klienter: adminClient (write access med admin API key) och searchClient (bara read access)
// Admin-nyckeln finns bara server-side, *aldrig i webbläsaren*

import { algoliasearch } from 'algoliasearch';

const INDEX_NAME = 'products';

const APP_ID = process.env.ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY;

if (!APP_ID || !ADMIN_KEY || !SEARCH_KEY) {
  throw new Error('Algolia env vars missing (ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY, ALGOLIA_SEARCH_KEY)');
}

// Admin-klienten har write access: indexera, uppdatera, ta bort
const adminClient = algoliasearch(APP_ID, ADMIN_KEY);

// Sök-klienten har bara läsrättigheter
const searchClient = algoliasearch(APP_ID, SEARCH_KEY);

// Dessa kommer endast att användas av denna adapter så vi låter de leva här istället för t.ex. /integrations/search/types.ts
// Algolias objectID måste heta så och är vår supplier_sku (artikelnumret)
// Edit: det här är första gången under detta år jag fifflat med TypeScript jag stött på en situation där vi måste välja
// interface/type över den andra, där valet faktiskt spelar roll!
// Se kommentar under för `objects` nyckeln i `adminClient.saveObjects`. För att uppfylla `Record<string, unknown>[]` för
// `objects` måste vi använda `type`. `interface` stöder inte detta!
export type AlgoliaProduct = {
  objectID: string;
  id: number;
  name: string;
  current_price: number;
  category_id: number;
  stock: number;
  variants: string[] | null;
}

export interface SearchResult {
  hits: AlgoliaProduct[];
  totalHits: number;
  totalPages: number;
  page: number;
}

// Indexera produkter i bulk. saveObjects är upsert över objectID
// waitForTasks: vänta tills Algolia är klar, så en sökning direkt efter hittar produkterna
export async function indexProducts(products: AlgoliaProduct[]): Promise<number> {
  await adminClient.saveObjects({
    indexName: INDEX_NAME,
    objects: products, // Denna vill ha TS "kontraktet" `Record<string, unknown>[]` och interface kan inte ge det! Se ovan
    waitForTasks: true,
  });

  return products.length;
}

// Ta bort en produkt från indexet
export async function removeProduct(objectID: string): Promise<void> {
  await adminClient.deleteObject({
    indexName: INDEX_NAME,
    objectID,
  });
}

// Och slutligen sök via search-only klienten
export async function searchProducts(query: string, page: number, hitsPerPage: number): Promise<SearchResult> {
  const result = await searchClient.searchSingleIndex<AlgoliaProduct>({
    indexName: INDEX_NAME,
    searchParams: {
      query,
      page: page - 1, // Algolia är 0-indexerat, vårt API är 1-baserat!
      hitsPerPage,
    },
  });

  return {
    hits: result.hits,
    totalHits: result.nbHits ?? 0,
    totalPages: result.nbPages ?? 0,
    page,
  };
}