import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ThankYouPage({ searchParams }: PageProps<'/thank-you'>) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const raw = (await searchParams).order;
  const orderId = typeof raw === 'string' && Number.isInteger(Number(raw)) ? Number(raw) : null;

  return (
    <div className="lp-container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
      <p className="lp-eyebrow text-accent">Tack för din order</p>

      <h1 className="text-4xl font-bold uppercase leading-tight tracking-tight sm:text-6xl">
        Ordern är mottagen
      </h1>

      {orderId !== null && (
        <p className="lp-eyebrow text-muted">Ordernummer #{orderId}</p>
      )}

      <p className="max-w-md text-sm text-muted">
        En bekräftelse skulle normalt skickas till {user.email}. Det här är ett skolprojekt,
        så ingen betalning har genomförts och inget kommer att skickas.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Link href="/products" className="lp-btn-primary">Fortsätt handla</Link>
        <Link href="/profile/orders" className="lp-btn-ghost">Mina ordrar</Link>
      </div>
    </div>
  )
};
