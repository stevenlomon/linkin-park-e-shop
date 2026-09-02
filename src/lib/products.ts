import { pool } from './db';
import { type ProductListItem, type Product, type ProductDetail } from './types';

// Samma mönster som getAllLeafCategories: en vanlig funktion, ingen route handler.
// Server Components anropar den direkt — ingen HTTP-runda till oss själva
export async function getAllActiveProducts(categoryId?: number | null): Promise<ProductListItem[]> {
  const query = {
    name: 'fetch-all-active-products',
    // `$1::int IS NULL OR ...` gör att *samma* query fungerar både med och utan
    // filter. Skickar vi null blir villkoret sant för alla rader. Cast:en till ::int
    // behövs för att Postgres ska kunna typa parametern när den är null
    text: `
      SELECT
        p.id,
        p.name,
        p.current_price,
        c.name AS currency_code,
        pi.id AS image_id,
        pi.alt_text AS image_alt_text
      FROM product p
      LEFT JOIN currency c ON p.currency_id = c.id
      LEFT JOIN product_image pi ON pi.product_id = p.id
      WHERE p.is_active = true
        AND ($1::int IS NULL OR p.category_id = $1)
      ORDER BY p.name
    `,
    values: [categoryId ?? null],
  }

  const res = await pool.query<ProductListItem>(query);
  return res.rows;
};

export async function getProductById(id: number): Promise<Product | null> {
  const query = {
    name: 'fetch-active-product-by-id',
    // Inga JOINs eftersom id för currency och category är allt vi behöver! Vi filterar heller inte på `is_active = true`; en avaktiverad
    // produkt måste gå att öppna, annars går den inte att aktivera igen!! Det tänkte jag inte alls på haha
    text: `
      SELECT
        id,
        name,
        description,
        standard_price,
        current_price,
        currency_id,
        category_id,
        is_active
      FROM product
      WHERE id = $1
    `,
    values: [id],
  }

  const res = await pool.query<Product>(query);
  return res.rows[0];
};
export async function getProductDetail(id: number): Promise<ProductDetail | null> {
  const query = {
    name: 'fetch-product-detail',
    text: `
      SELECT
        p.id,
        p.name,
        p.description,
        p.standard_price,
        p.current_price,
        p.is_active,
        cu.name AS currency_code,
        ca.name AS category_name
      FROM product p
      LEFT JOIN currency cu ON p.currency_id = cu.id
      LEFT JOIN category ca ON p.category_id = ca.id
      WHERE p.id = $1
    `,
    values: [id],
  }

  const res = await pool.query<ProductDetail>(query);
  return res.rows[0] ?? null;
};
