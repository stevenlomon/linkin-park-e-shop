import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ThankYouPage({ searchParams }: PageProps<'/thank-you'>) {
  const user = await getCurrentUser();

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
        {user
          ? `En bekräftelse skulle normalt skickas till ${user.email}.`
          : 'En bekräftelse skulle normalt skickas till e-postadressen du angav i kassan.'}{' '}
        Det här är ett skolprojekt, så ingen betalning har genomförts och inget kommer att skickas.
      </p>

      <p className="max-w-md text-xs text-muted">
        Spara ordernumret om du vill hänvisa till köpet.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Link href="/products" className="lp-btn-primary">Fortsätt handla</Link>
      </div>
    </div>
  )
};
