import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getProfileStats } from '@/lib/orders';
import ProfileForm from '@/components/profile/ProfileForm';
import LoginPrompt from '@/components/profile/LoginPrompt';

export const dynamic = 'force-dynamic';

function formatPrice(value: string | number) {
  return Number(value).toFixed(2).replace('.', ',');
}

function formatDate(value: Date) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="lp-container max-w-2xl pt-6 pb-16">
        <header className="mb-10 border-b border-line pb-8">
          <p className="lp-eyebrow mb-3 text-accent">Min sida</p>
          <h1 className="lp-heading">Logga in för att se din sida</h1>
        </header>

        <p className="mb-8 text-sm leading-relaxed text-bone/80">
          Här samlas din orderhistorik, dina tidigare köp och dina kunduppgifter. Logga in för
          att se dina ordrar, följa vad du har beställt och spara din adress så att den fylls i
          automatiskt i kassan.
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

  const stats = await getProfileStats(user.id);

  const hasCustomerInfo = Boolean(user.fname && user.lname && user.street && user.city && user.postal_code && user.country);

  return (
    <div className="lp-container pt-6 pb-16">
      <header className="mb-10 border-b border-line pb-8">
        <p className="lp-eyebrow mb-3 text-accent">Min profil</p>
        <h1 className="lp-heading">{user.username}</h1>
        <p className="mt-3 text-sm text-muted">{user.email}</p>
      </header>

      <div className="mb-12 grid gap-px bg-line sm:grid-cols-3">
        <div className="bg-ink p-6">
          <p className="lp-eyebrow mb-2 text-muted">Medlem sedan</p>
          <p className="text-2xl font-bold">{stats ? formatDate(stats.created_at) : '—'}</p>
        </div>

        <div className="bg-ink p-6">
          <p className="lp-eyebrow mb-2 text-muted">Antal ordrar</p>
          <p className="text-2xl font-bold">{stats?.order_count ?? 0}</p>
        </div>

        <div className="bg-ink p-6">
          <p className="lp-eyebrow mb-2 text-muted">Totalt handlat</p>
          <p className="text-2xl font-bold">{formatPrice(stats?.total_spent ?? 0)} SEK</p>
        </div>
      </div>

      <div className="mb-12">
        <Link href="/profile/orders" className="lp-btn-ghost">
          Se mina ordrar
        </Link>
      </div>

      <section className="border-t border-line pt-10">
        <h2 className="lp-eyebrow mb-2 text-muted">Kunduppgifter</h2>

        <p className="mb-8 text-sm text-muted">
          {hasCustomerInfo
            ? 'Dina uppgifter är kompletta och används i kassan.'
            : 'Fyll i dina uppgifter så slipper du skriva dem i kassan.'}
        </p>

        <div className="max-w-2xl">
          <ProfileForm user={user} />
        </div>
      </section>
    </div>
  )
};
