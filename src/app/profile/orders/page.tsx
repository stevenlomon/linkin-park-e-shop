import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getAllOrders } from '@/lib/orders';
import LoginPrompt from '@/components/profile/LoginPrompt';

export const dynamic = 'force-dynamic';

function formatPrice(value: string | number) {
  return Number(value).toFixed(2).replace('.', ',');
}

function formatDate(value: Date) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function ProfileOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="lp-container max-w-2xl pt-6 pb-16">
        <header className="mb-10 border-b border-line pb-8">
          <p className="lp-eyebrow mb-3 text-accent">Mina ordrar</p>
          <h1 className="lp-heading">Logga in för att se dina ordrar</h1>
        </header>

        <p className="mb-8 text-sm leading-relaxed text-bone/80">
          Din orderhistorik visar allt du har beställt, vad varje vara kostade när du köpte den
          och vilken adress ordern skickades till. Logga in för att se den.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <LoginPrompt />
          <Link href="/products" className="lp-btn-ghost">Till produkterna</Link>
        </div>

        <p className="mt-6 text-xs text-muted">
          Du hittar inloggningen längst upp till höger. Testanvändare finns på{' '}
          <Link href="/about" className="text-accent underline underline-offset-4">om-sidan</Link>.
        </p>
      </div>
    )
  }

  const orders = await getAllOrders(user.id);

  return (
    <div className="lp-container pt-6 pb-16">
      <Link href="/profile" className="lp-eyebrow text-muted transition-colors hover:text-bone">
        ← Min profil
      </Link>

      <header className="mt-8 mb-10 border-b border-line pb-8">
        <p className="lp-eyebrow mb-3 text-accent">Mina ordrar</p>
        <h1 className="lp-heading">Orderhistorik</h1>
      </header>

      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-8 text-sm text-muted">Du har inte lagt någon order än.</p>
          <Link href="/products" className="lp-btn-primary">Till produkterna</Link>
        </div>
      ) : (
        <ul className="space-y-px bg-line">
          {orders.map((order) => (
            <li key={order.id} className="bg-ink p-8">
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="lp-eyebrow">Order #{order.id}</p>
                  <p className="mt-2 text-xs text-muted">{formatDate(order.ordered_at)}</p>
                </div>

                <p className="text-lg font-bold">{formatPrice(order.total)} SEK</p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="lp-eyebrow mb-3 text-muted">Produkter</p>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={index} className="text-sm text-muted">
                        <span className="text-bone">{item.quantity} ×</span> {item.name}
                        <span className="ml-2 text-xs">({formatPrice(item.price_at_purchase)} st)</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="lp-eyebrow mb-3 text-muted">Levereras till</p>
                  <p className="text-sm text-muted">
                    {order.shipping_street}
                    <span className="mt-1 block">{order.shipping_postal_code} {order.shipping_city}</span>
                    <span className="block">{order.shipping_country}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
};
