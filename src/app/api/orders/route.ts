import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { resolveCartId, GUEST_CART_COOKIE } from '@/lib/cart';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/integrations/payments/stripeAdapter';
import { getShippingPrice, getShippingLabel } from '@/lib/shipping';
import { findServicePoints } from '@/lib/integrations/shipping/postnordAdapter';
import type { ShippingMethod } from '@/lib/shipping';

export async function POST(req: Request) {
  const user = await getCurrentUser();

  const { name, email, shippingMethod, postalCode, servicePointId, servicePointName } = await req.json();

  if (typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Namn måste fyllas i' }, { status: 400 });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'En giltig e-postadress krävs' }, { status: 400 });
  }

  // --- Shipping validation ---

  if (shippingMethod !== 'ombud' && shippingMethod !== 'home') {
    return NextResponse.json({ error: 'Välj fraktsätt (ombud eller hemleverans)' }, { status: 400 });
  }

  if (typeof postalCode !== 'string' || !/^\d{5}$/.test(postalCode)) {
    return NextResponse.json({ error: 'Postnummer måste vara 5 siffror' }, { status: 400 });
  }

  // Ombud kräver service point — servern validerar mot PostNord så att ingen kan skicka ett påhittat ID
  if (shippingMethod === 'ombud') {
    if (!servicePointId || !servicePointName) {
      return NextResponse.json({ error: 'Välj ett ombud' }, { status: 400 });
    }

    try {
      const points = await findServicePoints(postalCode);
      const valid = points.some((p) => p.id === servicePointId);

      if (!valid) {
        return NextResponse.json(
          { error: 'Ogiltigt ombud. Välj ett från listan.' },
          { status: 400 },
        );
      }
    } catch {
      // PostNord nere → vi kan inte validera ombudet, neka ordern med tydligt meddelande
      return NextResponse.json(
        { error: 'Kunde inte verifiera ombudet. Försök igen eller välj hemleverans.' },
        { status: 502 },
      );
    }
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

    // Beräkna varukorgens totalpris — från databasen, ALDRIG React!
    const cartTotal = cartRes.rows.reduce(
      (sum, item) => sum + Number(item.current_price) * item.quantity,
      0,
    );

    // Fraktpris beräknas server-side. React skickar ALDRIG priset — precis som produktpriserna
    const shippingPrice = getShippingPrice(shippingMethod as ShippingMethod, cartTotal);

    // Ordern skapas med fraktdata — shipping_price är vad vi faktiskt debiterar (snapshot, som price_at_purchase)
    const orderRes = await client.query<{ id: number }>(
      `INSERT INTO "Order" (
        user_id, guest_name, guest_email, status,
        shipping_method, shipping_price, service_point_id, service_point_name,
        shipping_postal_code
      )
       VALUES ($1, $2, $3, 'unpaid', $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        user?.id ?? null,
        name.trim(),
        email.trim(),
        shippingMethod,
        shippingPrice,
        shippingMethod === 'ombud' ? servicePointId : null,
        shippingMethod === 'ombud' ? servicePointName : null,
        postalCode,
      ]
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

    // Frakt som extra line_item i Stripe — kunden ser "Ombud (PostNord) 59,00 kr" på betalningssidan.
    // Fraktpris 0 (fri frakt) → vi lägger inte till en rad, Stripe visar bara produkterna
    if (shippingPrice > 0) {
      checkoutItems.push({
        name: getShippingLabel(shippingMethod as ShippingMethod),
        price: shippingPrice,
        quantity: 1,
      });
    }

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
