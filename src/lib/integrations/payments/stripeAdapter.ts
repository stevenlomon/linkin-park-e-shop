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

  // Line items, stripe session object och verifiera webhook här
}