import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { getCart } from '@/lib/cart';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export const dynamic = 'force-dynamic';

function formatPrice(value: number) {
  return value.toFixed(2).replace('.', ',');
}

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const items = await getCart();

  if (!items || items.length === 0) {
    return (
      <div className="lp-container pt-6 pb-16">
        <header className="mb-10 border-b border-line pb-8">
          <h1 className="lp-heading">Kassa</h1>
        </header>

        <p className="mb-8 text-sm text-muted">Din varukorg är tom.</p>

        <Link href="/products" className="lp-btn-primary">Till produkterna</Link>
      </div>
    )
  }

  const total = items.reduce((sum, item) => sum + Number(item.current_price) * item.quantity, 0);
  const currencyCode = items[0].currency_code ?? 'SEK';

  return (
    <div className="lp-container pt-6 pb-16">
      <header className="mb-10 border-b border-line pb-8">
        <p className="lp-eyebrow mb-3 text-accent">Kassa</p>
        <h1 className="lp-heading">Slutför ditt köp</h1>
      </header>

      <div className="grid gap-16 lg:grid-cols-[1fr_24rem]">

        <div>
          <h2 className="lp-eyebrow mb-6 text-muted">Leveransuppgifter</h2>
          <CheckoutForm user={user} />
        </div>

        <aside className="lg:border-l lg:border-line lg:pl-10">
          <h2 className="lp-eyebrow mb-6 text-muted">Din order</h2>

          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.item_id} className="flex gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden bg-tile">
                  {item.image_id && (
                    <Image
                      src={`/api/images/${item.image_id}`}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold uppercase tracking-[0.1em]">{item.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.quantity} × {formatPrice(Number(item.current_price))} {item.currency_code ?? 'SEK'}
                  </p>
                </div>

                <p className="shrink-0 text-xs">
                  {formatPrice(Number(item.current_price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-baseline justify-between border-t border-line pt-6">
            <span className="lp-eyebrow">Totalt</span>
            <span className="text-lg font-bold">{formatPrice(total)} {currencyCode}</span>
          </div>

          <p className="mt-3 text-xs text-muted">Frakt tillkommer inte i det här skolprojektet.</p>
        </aside>

      </div>
    </div>
  )
};
