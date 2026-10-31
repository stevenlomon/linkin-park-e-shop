// Vår gamla thank-you page ersätts nu av denna confirmation page som Stripe kommer använda

import Link from 'next/link';
import { pool } from '@/lib/db';

// Det är viktigt att denna sida aldrig cache:as och istället alltid laddas fresh
export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  unpaid: 'Inväntar betalning',
  paid: 'Betald',
  cancelled: 'Avbruten',
};

export default async function ConfirmationPage({ searchParams }: PageProps<'/order/confirmation'>) {
  const sessionId = (await searchParams).session_id;

  // Validera sessionId, hämta ordern, varorna och totalbeloppet helt server side, och rendera allt 
}