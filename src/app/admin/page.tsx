import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getAllOrders } from '@/lib/orders';

export const dynamic = 'force-dynamic';

function formatPrice(value: string | number) {
  return Number(value).toFixed(2).replace('.', ',');
}

function formatDate(value: Date) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (user?.role_name !== 'admin') redirect('/');

  const orders = await getAllOrders();

  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const itemsSold = orders.reduce((sum, order) => sum + order.item_count, 0);

  return (
    <div className="lp-container-wide pt-6 pb-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="lp-eyebrow mb-3 text-accent">Admin</p>
          <h1 className="lp-heading">Ordrar</h1>
        </div>
      </header>

      <div className="mb-12 grid gap-px bg-line sm:grid-cols-3">
        <div className="bg-ink p-6">
          <p className="lp-eyebrow mb-2 text-muted">Ordrar</p>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>

        <div className="bg-ink p-6">
          <p className="lp-eyebrow mb-2 text-muted">Sålda artiklar</p>
          <p className="text-3xl font-bold">{itemsSold}</p>
        </div>

        <div className="bg-ink p-6">
          <p className="lp-eyebrow mb-2 text-muted">Total omsättning</p>
          <p className="text-3xl font-bold">{formatPrice(revenue)} SEK</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">Inga ordrar än.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="lp-eyebrow py-4 pr-6 text-muted">Order</th>
                <th className="lp-eyebrow py-4 pr-6 text-muted">Datum</th>
                <th className="lp-eyebrow py-4 pr-6 text-muted">Kund</th>
                <th className="lp-eyebrow py-4 pr-6 text-muted">Leveransadress</th>
                <th className="lp-eyebrow py-4 pr-6 text-muted">Produkter</th>
                <th className="lp-eyebrow py-4 text-right text-muted">Summa</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line align-top">
                  <td className="py-6 pr-6 text-sm font-bold">#{order.id}</td>

                  <td className="py-6 pr-6 text-sm text-muted">{formatDate(order.ordered_at)}</td>

                  <td className="py-6 pr-6 text-sm">
                    {order.username ?? <span className="text-muted">Borttagen användare</span>}
                    {order.email && (
                      <span className="mt-1 block text-xs text-muted">{order.email}</span>
                    )}
                  </td>

                  <td className="py-6 pr-6 text-sm text-muted">
                    {order.shipping_street}
                    <span className="mt-1 block">
                      {order.shipping_postal_code} {order.shipping_city}
                    </span>
                    <span className="block">{order.shipping_country}</span>
                  </td>

                  <td className="py-6 pr-6 text-sm">
                    <ul className="space-y-1">
                      {order.items.map((item, index) => (
                        <li key={index} className="text-muted">
                          <span className="text-bone">{item.quantity} ×</span> {item.name}
                          <span className="ml-2 text-xs">
                            ({formatPrice(item.price_at_purchase)} st)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>

                  <td className="py-6 text-right text-sm font-bold">
                    {formatPrice(order.total)} SEK
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
};
