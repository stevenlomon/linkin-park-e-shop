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
  // Kod ska skrivas här
}