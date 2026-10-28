import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ImportForm from '@/components/admin/ImportForm';

// Denna sida cache:as aldrig! Vi behöver att den renderar fräsch vid varje request
export const dynamic = 'force-dynamic';

// Page shell som tar hand om auth och importerar client components
export default async function ImportPage() {
  const user = await getCurrentUser();
  if (user?.role_name !== 'admin') redirect('/');

  return (
    <div className="lp-container-wide pt-6 pb-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="lp-eyebrow mb-3 text-accent">Admin</p>
          <h1 className="lp-heading">Importera produkter</h1>
        </div>
      </header>

      <ImportForm />
    </div>
  );
}