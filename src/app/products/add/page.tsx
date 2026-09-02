import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAllLeafCategories } from '@/lib/categories';
import { getAllCurrencies } from '@/lib/currencies';
import CreateProductForm from '@/components/products/CreateProductForm' // Sever seeds the client pattern som vi använder i Florilegium!

export const dynamic = 'force-dynamic'; // Signalerar till Next.js att denna sida är server-rendered!

export default async function AddProductPage() {
  // Innan nånting; kolla admin status!
  const user = await getCurrentUser();
  console.log("user: ", user);
  if (user?.role_name !== 'admin') {
    redirect('/');
  }

  const [leafCatories, currencies] = await Promise.all([
    getAllLeafCategories(),
    getAllCurrencies(),
  ]);

  return (
    <CreateProductForm leafCategories={leafCatories} currencies={currencies} />
  )
};