import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyWebhook } from '@/lib/integrations/payments/stripeAdapter';

// Jag va tvungen att ställa om min hjärna här. "Vi tar ju emot data. Varför är det då POST och inte GET?"
// Vi definerar en endpoint! Stripe kör en POST request till vår endpoint så när vi skapar den här är det POST. Inte GET
export async function POST(req: Request) {
  // Kod kommer här
}