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

// Dessa kommer endast att användas av denna adapter så vi låter de leva här istället för t.ex. /integrations/search/types.ts
// Algolias objectID måste heta så och är vår supplier_sku (artikelnumret)
export interface AlgoliaProduct {
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