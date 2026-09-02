import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth'
import { getProductById } from '@/lib/products';
import { getAllLeafCategories } from '@/lib/categories';
import { getAllCurrencies } from '@/lib/currencies';
import { getProductImage } from '@/lib/productImage';
import EditProductForm from '@/components/products/EditProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: PageProps<'/products/[id]/edit'>) {
  // Innan nånting; admin säkra sidan!
  const user = await getCurrentUser();
  if (user?.role_name !== 'admin') {
    redirect('/');
  }

  const { id } = await params;                     // Plocka `id` från URL så att vi kan...
  const productId = Number(id);

  if (!Number.isInteger(productId)) notFound();    // Denna fångar "nonsense URLs" som `/products/abc/edit`. `notFound()`; bra att känna till!

  const product = await getProductById(productId); // ..använda vår nya funktion! Som vill ha den som Number
  if (!product) notFound();                        // Denna fångar "nonsense URLs" som `products/999/edit` om vi inte har det i databasen!
  // Och nu försvann ALLA TS errors haha. För nu vet TS med säkerhet att vi jobbar med en variabel 
  // med namn `product` som garanterat är av typ `Product`, inte `Product | null`! Got it, got it

  // Alternativen till dropdownsen. Oberoende av varandra, så vi kör dem parallellt
  const [leafCategories, currencies, existingImage] = await Promise.all([
    getAllLeafCategories(),
    getAllCurrencies(),
    getProductImage(productId),
  ]);

  return (
    <EditProductForm
      initialProductData={product}
      leafCategories={leafCategories}
      currencies={currencies}
      existingImage={existingImage}
    />
  )
};