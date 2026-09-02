import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 100% skriven av Claude Code på deadline day
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Du måste vara inloggad' }, { status: 401 });
  }

  const { fname, lname, street, city, postalCode, country } = await req.json();

  const fields = { fname, lname, street, city, postalCode, country };
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || value.trim() === '') {
      return NextResponse.json({ error: `Fältet ${key} måste fyllas i` }, { status: 400 });
    }
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
       WHERE c.user_id = $1`,
      [user.id]
    );

    if (cartRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Varukorgen är tom' }, { status: 400 });
    }

    await client.query(
      `UPDATE "User"
       SET fname = $1, lname = $2, street = $3, city = $4, postal_code = $5, country = $6
       WHERE id = $7`,
      [fname.trim(), lname.trim(), street.trim(), city.trim(), postalCode.trim(), country.trim(), user.id]
    );

    const orderRes = await client.query<{ id: number }>(
      `INSERT INTO "Order" (user_id, shipping_street, shipping_city, shipping_postal_code, shipping_country)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [user.id, street.trim(), city.trim(), postalCode.trim(), country.trim()]
    );

    const orderId = orderRes.rows[0].id;

    for (const item of cartRes.rows) {
      await client.query(
        `INSERT INTO orders_products (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.current_price]
      );
    }

    await client.query(
      `DELETE FROM carts_products
       WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1)`,
      [user.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({ success: 'ok', data: { orderId } }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Kunde inte skapa ordern:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
};
