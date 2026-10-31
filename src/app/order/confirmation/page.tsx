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

  // Validera sessionId
  if (typeof sessionId !== 'string') {
    return (
      <div className="lp-container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
        <h1 className="text-4xl font-bold uppercase tracking-tight">Ogiltig länk</h1>
        <p className="text-sm text-muted">Ingen session hittades.</p>
        <Link href="/products" className="lp-btn-primary">Till produkterna</Link>
      </div>
    );
  }

  // Hämta ordern, varorna och totalbeloppet helt server side
  const orderRes = await pool.query<{
    id: number; status: string; guest_name: string; guest_email: string; ordered_at: string;
  }>(
    `SELECT id, status, guest_name, guest_email, ordered_at
     FROM "Order"
     WHERE stripe_session_id = $1`,
    [sessionId]
  );
  const order = orderRes.rows[0];

  if (!order) {
    return (
      <div className="lp-container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
        <h1 className="text-4xl font-bold uppercase tracking-tight">Ordern hittades inte</h1>
        <p className="text-sm text-muted">Kontrollera länken och försök igen.</p>
        <Link href="/products" className="lp-btn-primary">Till produkterna</Link>
      </div>
    );
  }

  // Viktigt här att vi får price at purchase. En snapshot till när kunden köpte
  const itemsRes = await pool.query<{
    name: string; quantity: number; price_at_purchase: string;
  }>(
    `SELECT p.name, op.quantity, op.price_at_purchase
     FROM orders_products op
     JOIN product p ON p.id = op.product_id
     WHERE op.order_id = $1
     ORDER BY p.name`,
    [order.id]
  );
  const items = itemsRes.rows;

  // Totalen för hela ordern med en smidig reduce
  const total = items.reduce(
    (sum, item) => sum + Number(item.price_at_purchase) * item.quantity,
    0
  );

  return (
    <div className="lp-container pt-6 pb-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 border-b border-line pb-8 text-center">
          <p className="lp-eyebrow mb-3 text-accent">
            {order.status === 'paid' ? 'Tack för ditt köp' : 'Orderbekräftelse'}
          </p>
          <h1 className="text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            Order #{order.id}
          </h1>
        </header>

        <div className="mb-10 flex justify-center">
          <span className={`inline-block px-4 py-2 text-sm font-bold uppercase tracking-widest ${
            order.status === 'paid'
              ? 'bg-green-900/30 text-green-400'
              : order.status === 'cancelled'
                ? 'bg-red-900/30 text-red-400'
                : 'bg-yellow-900/30 text-yellow-400'
          }`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="lp-eyebrow mb-4 text-muted">Produkter</h2>
            <ul className="divide-y divide-line">
              {items.map((item, i) => (
                <li key={i} className="flex items-baseline justify-between py-3">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-wide">{item.name}</span>
                    <span className="ml-2 text-xs text-muted">× {item.quantity}</span>
                  </div>
                  <span className="text-sm">
                    {(Number(item.price_at_purchase) * item.quantity).toFixed(2).replace('.', ',')} SEK
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-baseline justify-between border-t border-line pt-6">
            <span className="lp-eyebrow">Totalt</span>
            <span className="text-lg font-bold">{total.toFixed(2).replace('.', ',')} SEK</span>
          </div>

          <div className="border-t border-line pt-6">
            <h2 className="lp-eyebrow mb-4 text-muted">Uppgifter</h2>
            <p className="text-sm">{order.guest_name}</p>
            <p className="text-sm text-muted">{order.guest_email}</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/products" className="lp-btn-primary">Fortsätt handla</Link>
        </div>
      </div>
    </div>
  );
}