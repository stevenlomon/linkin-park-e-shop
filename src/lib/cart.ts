import { cache } from 'react';
import { cookies } from 'next/headers';
import { pool } from './db';
import { CartItem } from './types';
import { getCurrentUser } from './auth';

// Cart använder nu cookie istället för user id
export const GUEST_CART_COOKIE = 'linkin-park-guest-cart';

export const resolveCartId = cache(async (): Promise<number | null> => {
  const user = await getCurrentUser();

  if (user) {
    const res = await pool.query<{ id: number }>(
      'SELECT id FROM cart WHERE user_id = $1',
      [user.id]
    );
    return res.rows[0]?.id ?? null;
  }

  const raw = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  if (!raw) return null;

  const cartId = Number(raw);
  if (!Number.isInteger(cartId)) return null;

  const res = await pool.query<{ id: number }>(
    'SELECT id FROM cart WHERE id = $1 AND user_id IS NULL',
    [cartId]
  );
  return res.rows[0]?.id ?? null;
});

// Hämtar användarens varukorg, eller skapar den om den inte finns
export async function getOrCreateCartId(): Promise<number> {
  const user = await getCurrentUser();

  if (user) {
    const query = {
      name: 'get-or-create-cart',
      text: `
        INSERT INTO cart (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO UPDATE SET last_updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `,
      values: [user.id],
    };

    const res = await pool.query<{ id: number }>(query);
    return res.rows[0].id;
  }

  const existing = await resolveCartId();
  if (existing !== null) return existing;

  const res = await pool.query<{ id: number }>(
    'INSERT INTO cart (user_id) VALUES (NULL) RETURNING id'
  );
  const cartId = res.rows[0].id;

  (await cookies()).set(GUEST_CART_COOKIE, String(cartId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return cartId;
};

// Varukorgens innehåll. Tom lista om varken inloggad användare eller gästvarukorg finns
export const getCart = cache(async (): Promise<CartItem[]> => {
  const cartId = await resolveCartId();
  if (cartId === null) return [];

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
      WHERE c.id = $1
      ORDER BY cp.added_at
    `,
    values: [cartId],
  };

  const res = await pool.query<CartItem>(query);
  return res.rows; // Inte rows[0]; vi vill ha alla produkter i varukorgen!
})

// För att visa siffran i navbaren
export const getCartItemCount = cache(async (): Promise<number> => {
  const cartId = await resolveCartId();
  if (cartId === null) return 0;

  const query = {
    name: 'fetch-cart-count',
    // COALESCE eftersom SUM över noll rader ger NULL, inte 0. Denna har jag ändå sett i Florilegium!
    // ::int eftersom SUM annars returnerar bigint som pg lämnar tillbaka som *string*. Detta är helt nytt för mig
    text: `
      SELECT COALESCE(SUM(cp.quantity), 0)::int AS count
      FROM cart c
      JOIN carts_products cp ON cp.cart_id = c.id
      WHERE c.id = $1
    `,
    values: [cartId],
  };

  const res = await pool.query<{ count: number }>(query);
  return res.rows[0].count;
})
