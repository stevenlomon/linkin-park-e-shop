import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchProducts } from '@/lib/integrations/search/algoliaAdapter';

// Zod schema för validering av sökparametrar
// Reasonable defaults: Sök strängen får vara max 100 karaktärer, page är heltal och inte mindre än 1
// pageSize default är 12 vilket om jag förstår rätt är e-commerce standard. Jämt delbart med 3, 4, och 6!
const SearchQuery = z.object({
  q: z.string().max(100).default(''),

  // z.coerce.number() hjälper att konvertera query string till number. "2" -> 2
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Vårt validerings steg. safeParse ger antingen "success" eller "error"
  // `Object.fromEntries(searchParams)` konverterar URLSearchParams så att zod kan parse:a det
  const result = SearchQuery.safeParse(Object.fromEntries(searchParams));

  if (!result.success) {
    return NextResponse.json(
      // Det finns även `z.treeifyError()` om jag förstår rätt för mer struktur i error objektet om jag
      // förstår rätt? Men vi tjänar inte riktigt nånting på det här så vi kör på med `z.prettifyError()`
      { error: 'Ogiltiga sökparametrar', details: z.prettifyError(result.error) },
      { status: 400 }
    );
  }

  const { q, page, pageSize } = result.data;

  try {
    const searchResult = await searchProducts(q, page, pageSize);

    // Vi svarar på shoppens format, inte på Algolias. Dvs vårt interna id, inte Algolias objectID
    return NextResponse.json({
      products: searchResult.hits.map((hit) => ({
        id: hit.id,
        name: hit.name,
        current_price: hit.current_price,
        category_id: hit.category_id,
        stock: hit.stock,
        variants: hit.variants,
      })),
      meta: {
        page: searchResult.page,
        pageSize,
        totalHits: searchResult.totalHits,
        totalPages: searchResult.totalPages,
      },
    });
  } catch (err) {
    console.error('Search failed:', err);
    return NextResponse.json(
      { error: 'Sökningen misslyckades' },
      { status: 500 }
    );
  }
}