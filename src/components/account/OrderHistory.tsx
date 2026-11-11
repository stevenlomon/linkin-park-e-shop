// Denna (och säkert andra också) behöver tekniskt sett inte vara en client component. Vi har ingen state att hålla koll
// på, inga hooks, inga event handlers etc. etc. Men jag ser det ändå som värt det att hålla consistency i kodbasen med
// denna boundary av server och fetching och client rendering. Plus! Om vi lägger till filtering eller annat som kräver
// `useState` har vi vår boundary already in place så att säga
'use client';

import { type CustomerOrder } from '@/lib/types';

interface OrderHistoryProps {
  orders: CustomerOrder[];
}

// Två helper functions för rendreringen
function formatPrice(value: string | number) {
  return Number(value).toFixed(2).replace('.', ',');
}

function formatDate(value: Date) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OrderHistory({ orders }: OrderHistoryProps) {
  return (
    <section>
      <h2 className="lp-eyebrow mb-6 text-muted">Orderhistorik</h2>

      {orders.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          Du har inga ordrar än.
        </p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-line p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold">Order #{order.id}</span>
                  <span className="ml-4 text-sm text-muted">
                    {formatDate(order.ordered_at)}
                  </span>
                </div>
                <span
                  className={`inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                    order.status === 'paid'
                      ? 'bg-green-900/30 text-green-400'
                      : order.status === 'cancelled'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                  }`}
                >
                  {order.status === 'paid'
                    ? 'Betald'
                    : order.status === 'cancelled'
                      ? 'Avbruten'
                      : 'Obetald'}
                </span>
              </div>

              <ul className="mb-4 space-y-1">
                {order.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted">
                    <span className="text-bone">{item.quantity} ×</span>{' '}
                    {item.name}
                    <span className="ml-2 text-xs">
                      ({formatPrice(item.price_at_purchase)} st)
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-right text-sm font-bold">
                {formatPrice(order.total)} SEK
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}