import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyWebhook } from '@/lib/integrations/payments/stripeAdapter';

// Jag va tvungen att ställa om min hjärna här. "Vi tar ju emot data. Varför är det då POST och inte GET?"
// Vi definerar en endpoint! Stripe kör en POST request till vår endpoint så när vi skapar den här är det POST. Inte GET
export async function POST(req: Request) {
  // Viktigt första steg: Läs signature-headern. Saknas denna är webhooken inte från Stripe
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe-Signature' }, { status: 400 });
  }

  // Åter igen. Vi kallar på vår verifyWebhook funktion med den råa datan från webhooken. Inte req.json()
  const rawBody = await req.text();

  // Nu med signatur och rå data kan vi kolla med säkerhet om webhooken verkligen är från Stripe
  let event;
  try {
    event = verifyWebhook(rawBody, signature);
  } catch (err) {
    console.error('Webhook-signaturverifiering misslyckades:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[WEBHOOK] Event:', event.type, event.id);

  // Vi bryr oss om eventen 'session complete', 'session expired' och 'payment succeeded'
  switch(event.type) {
    // Vi hanterar 'session complete' och 'payment succeeded' samma då de betyder samma sak i vårt fall
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;

      // Test payments i en sandbox environment med '4242 4242 4242 4242' kommer alltid att betalas 
      // instantaneously. Det här är för fallet med bank transfers eller icke-instant payments
      if (session.payment_status !== 'paid') break;

      const orderId = session.client_reference_id;
      if (!orderId) break;

      // Transaction med rollback så att status och lager inte hamnar ur synk
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Vi skyddar mot att Stripe skickar samma event två gånger genom att kolla status = 'unpaid' här
        const updateRes = await client.query(
          `UPDATE "Order" SET status = 'paid' WHERE id = $1 AND status = 'unpaid'`,
          [orderId]
        );

        if (updateRes.rowCount === 0) {
          await client.query('ROLLBACK');
          console.log('[WEBHOOK] Order redan betald eller finns inte:', orderId);
          break;
        }

        // Om vi kommer hit: minska lagersaldot för varje produkt i ordern
        const items = await client.query<{ product_id: number; quantity: number }>(
          `SELECT product_id, quantity FROM orders_products WHERE order_id = $1`,
          [orderId]
        );
        for (const item of items.rows) {
          await client.query(
            `UPDATE product SET stock = stock - $1 WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }

        // Om vi kommer hit kan vi säkert commit hela transaktionen
        await client.query('COMMIT');
        console.log('[WEBHOOK] Order betald + lager minskat:', orderId);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[WEBHOOK] Kunde inte uppdatera order:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
      } finally {
        // Vare sig transaktionen lyckades eller misslyckades, frigör den dedikerade db pool klienten vi använt
        client.release();
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      const orderId = session.client_reference_id;
      if (!orderId) break;

      // Vi ändrar aldrig en betald order. Markera som avbruten endast om status fortfarande är 'unpaid'
      await pool.query(
        `UPDATE "Order" SET status = 'cancelled' WHERE id = $1 AND status = 'unpaid'`,
        [orderId]
      );

      console.log('[WEBHOOK] Order avbruten (session expired):', orderId);
      break;
    }

    // Som fallback case: Gör ingenting och logga att vi ignorerade eventet
    default:
      console.log('[WEBHOOK] Ignorerat event:', event.type);
  }

  // Vilket case som än körs och vare sig transaktionen går igenom eller resulterar i en rollback svarar vi
  // med 200 snabbt. Annars tror Stripe att leveransen misslyckades och skickar igen.
  return NextResponse.json({ received: true });
}