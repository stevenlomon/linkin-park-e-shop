import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { resolveCartId, GUEST_CART_COOKIE } from '@/lib/cart';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/integrations/payments/stripeAdapter';

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

    // Nu med lagersaldo integrerat!
    const cartRes = await client.query<{ product_id: number; quantity: number; name: string, current_price: string, stock: number }>(
      `SELECT cp.product_id, cp.quantity, p.name, p.current_price, p.stock
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

    // Nu med lagersaldo i applikationen måste vi kontrollera det! Man ska inte kunna köpa om stock är för lågt
    for (const item of cartRes.rows) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `${item.name} har inte tillräckligt i lager (${item.stock} kvar)` },
          { status: 400 }
        );
      }
    }

    // Och här när vi skapar ordern har vi även status integrerat! Ordern skapas som obetald. Webhook ändrar ordern till 'paid'!
    const orderRes = await client.query<{ id: number }>(
      `INSERT INTO "Order" (user_id, guest_name, guest_email, status)
       VALUES ($1, $2, $3, 'unpaid')
       RETURNING id`,
      [user?.id ?? null, name.trim(), email.trim()]
    );

    const orderId = orderRes.rows[0].id;

    // Det här är recontextualized för mig nu för jag ser så tydligt en viktig detalj från föreläsingarna: priset kommer frår
    // databasen, ALDRIG React/Frontenden!
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

    // Här efter transaktionen när det finns 0% chans för en ROLLBACK skapar vi vår Checkout Session hos Stripe. 
    // Om Stripe inte svarar får kunden ett felmeddelande och ordern förblir obetald
    const checkoutItems = cartRes.rows.map((item) => ({
      name: item.name,
      price: Number(item.current_price),
      quantity: item.quantity,
    }));

    try {
      const checkout = await createCheckoutSession(orderId, checkoutItems);

      // Nu när vi har vår checkout session kan vi spara stripe_session_id på ordern
      await pool.query(
        `UPDATE "Order" SET stripe_session_id = $1 WHERE id = $2`,
        [checkout.sessionId, orderId]
      );

      // Vår NextResponse innehåller nu checkout url. CheckoutForm ser till att React redirectar till denna URL
      return NextResponse.json({ url: checkout.url }, { status: 201 });
    } catch (err) {
      console.error('Kunde inte skapa Stripe Checkout Session:', err);
      return NextResponse.json(
        { error: 'Betalningen kunde inte startas. Försök igen senare.' },
        { status: 502 }
      );
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Kunde inte skapa ordern:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
};
