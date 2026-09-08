import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { resolveCartId, GUEST_CART_COOKIE } from '@/lib/cart';
import { cookies } from 'next/headers';

// 100% skriven av Claude Code på deadline day
export async function POST(req: Request) {
  const user = await getCurrentUser();

  const { name, email } = await req.json();

  if (typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Namn måste fyllas i' }, { status: 400 });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'En giltig e-postadress krävs' }, { status: 400 });
  }

  const cartId = await resolveCartId();
  if (cartId === null) {
    return NextResponse.json({ error: 'Varukorgen är tom' }, { status: 400 });
  }

  // Transactions!! Dessa känner jag igen, har en hel del i Florilegium! Fixa en dedicated pool och kör sedan 'BEGIN' och 'COMMIT'
  // med 'ROLLBACK' så att endast *fulla kompletta* orders finns i databasen!
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cartRes = await client.query<{ product_id: number; quantity: number; current_price: string }>(
      `SELECT cp.product_id, cp.quantity, p.current_price
       FROM cart c
       JOIN carts_products cp ON cp.cart_id = c.id
       JOIN product p ON p.id = cp.product_id
       WHERE c.id = $1`,
      [cartId]
    );

    if (cartRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Varukorgen är tom' }, { status: 400 });
    }

    const orderRes = await client.query<{ id: number }>(
      `INSERT INTO "Order" (user_id, guest_name, guest_email)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user?.id ?? null, name.trim(), email.trim()]
    );

    const orderId = orderRes.rows[0].id;

    for (const item of cartRes.rows) {
      await client.query(
        `INSERT INTO orders_products (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.current_price]
      );
    }

    await client.query('DELETE FROM carts_products WHERE cart_id = $1', [cartId]);

    if (!user) {
      await client.query('DELETE FROM cart WHERE id = $1', [cartId]);
    }

    await client.query('COMMIT');

    if (!user) {
      (await cookies()).delete(GUEST_CART_COOKIE);
    }

    return NextResponse.json({ success: 'ok', data: { orderId } }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Kunde inte skapa ordern:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
};
