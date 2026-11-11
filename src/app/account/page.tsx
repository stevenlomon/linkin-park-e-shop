import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getOrdersByUser } from '@/lib/orders';
// import OrderHistory from '@/components/account/OrderHistory'; Skapas i nästa commit

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const orders = await getOrdersByUser(user.id);

  return (
    <div className="lp-container-wide pt-6 pb-16">
      <header className="mb-10 border-b border-line pb-8">
        <p className="lp-eyebrow mb-3 text-accent">Mina sidor</p>
        <h1 className="lp-heading">Hej {user.username}!</h1>
      </header>

      {/* <OrderHistory orders={orders} /> */}
    </div>
  );
}