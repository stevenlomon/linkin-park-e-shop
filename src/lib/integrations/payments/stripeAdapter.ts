import Stripe from 'stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Samma pattern som i algoliaAdapter.ts
function getStripe() {
  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY saknas i .env');
  }

  const stripe = new Stripe(SECRET_KEY, { timeout: 10_000 });

  return { stripe, webhookSecret: WEBHOOK_SECRET };
}

// Viktigast med denna är att vi använder pris från databasen, ALDRIG från React
export type CheckoutItem = {
  name: string;
  price: number;
  quantity: number;
}

export async function createCheckoutSession(orderId: number, items: CheckoutItem[]) {
  const { stripe } = getStripe();

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: 'sek',
      unit_amount: Math.round(item.price * 100), // Stripe räknar i öre: 599 kr = 59900
      product_data: { name: item.name },
    },
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    client_reference_id: String(orderId), // Session ID är Stripe's referens, Order ID är *vår* referes
    success_url: `${APP_URL}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/checkout`,
  });

  return { sessionId: session.id, url: session.url };
}