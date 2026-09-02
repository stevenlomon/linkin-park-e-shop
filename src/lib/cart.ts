import { cache } from 'react';
import { pool } from './db';
import { CartItem } from './types';
import { getCurrentUser } from './auth';

// Den här filen är den som är *by far* mest outside of my techinical capabilities i hela kodbasen. Öppen och ärlig med det. 
// I'd like to dissect och pick it apart efter deadline
// `cache` har med memoization att göra. En sak jag once again vill göra en deep dive på efter deadline. 
// `export const getCartItemCount = cache(async (): Promise<number> => {` Har aldrig sett en funktion skriven på detta format
// innan och nu helt plöstligt har vi en fil här med två stycken. Det blir verkligen "så länge det funkar" tillsvidare!

// Hämtar användarens varukorg, eller skapar den om den inte finns
export async function getOrCreateCartId(userId: number): Promise<number> {
  const query = {
    name: 'get-or-create-cart',
    text: `
      INSERT INTO cart (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE SET last_updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    values: [userId],
  };

  const res = await pool.query(query);
  return res.rows[0].id;
};

// Varukorgens innehåll för inloggad användare. null = inte inloggad
export const getCart = cache(async (): Promise<CartItem[] | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const query = {
    name: 'fetch-cart-items',
    // Vår största SQL query hittills haha.
    // Vi läser current_price från product tabellen
    // JOIN på carts_products och product för vi måste ha full match och data, 
    // LEFT JOIN på currency för det är okej ifall vi saknar data där
    text: `
      SELECT
        cp.id            AS item_id,
        p.id             AS product_id,
        p.name           AS name,
        cp.quantity,
        p.current_price,
        cur.name         AS currency_code,
        pi.id            AS image_id
      FROM cart c
      JOIN carts_products cp ON cp.cart_id = c.id
      JOIN product p         ON p.id = cp.product_id
      LEFT JOIN currency cur ON cur.id = p.currency_id
      LEFT JOIN product_image pi ON pi.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY cp.added_at
    `,
    values: [user.id],
  };

  const res = await pool.query<CartItem>(query);
  return res.rows; // Inte rows[0]; vi vill ha alla produkter i varukorgen!
})

// För att visa siffran i navbaren
export const getCartItemCount = cache(async (): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) return 0;

  const query = {
    name: 'fetch-cart-count',
    // COALESCE eftersom SUM över noll rader ger NULL, inte 0. Denna har jag ändå sett i Florilegium!
    // ::int eftersom SUM annars returnerar bigint som pg lämnar tillbaka som *string*. Detta är helt nytt för mig
    text: `
      SELECT COALESCE(SUM(cp.quantity), 0)::int AS count
      FROM cart c
      JOIN carts_products cp ON cp.cart_id = c.id
      WHERE c.user_id = $1
    `,
    values: [user.id],
  };

  const res = await pool.query(query);
  return res.rows[0].count;
})