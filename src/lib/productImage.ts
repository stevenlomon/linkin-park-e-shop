import { pool } from './db';
import { type ProductImage } from './types';

export async function getProductImage(productId: number): Promise<ProductImage | null> {
  const query = {
    name: 'fetch-product-image',
    text: `
      SELECT id, product_id, mime_type, alt_text, size_bytes
      FROM product_image
      WHERE product_id = $1
    `,
    values: [productId],
  }

  const res = await pool.query<ProductImage>(query);
  return res.rows[0] ?? null;
};
