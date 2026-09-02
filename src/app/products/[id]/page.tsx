import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { getProductDetail } from '@/lib/products';
import { getProductImage } from '@/lib/productImage';
import AddToCartButton from '@/components/products/AddToCartButton';

export const dynamic = 'force-dynamic';

function formatPrice(value: string) {
  return Number(value).toFixed(2).replace('.', ',');
}

// Kommer 100% göra en deep dive kring `PageProps<AppRoute>` vs `RouteContext<AppRouteHandlerRoute>` i lugn och ro efter deadline
export default async function DetailedProductPage({ params }: PageProps<'/products/[id]'>) {
  const user = await getCurrentUser();
  const { id } = await params; // Simpelt sätt att få en variabel från vår URL!
  const productId = Number(id);

  if (!Number.isInteger(productId)) notFound();

  const product = await getProductDetail(productId);
  if (!product) notFound();

  const isAdmin = user?.role_name === 'admin';

  if (!product.is_active && !isAdmin) notFound();

  const image = await getProductImage(productId);

  const currencyCode = product.currency_code ?? 'SEK';
  const isOnSale = Number(product.current_price) < Number(product.standard_price);

  return (
    <div className="lp-container pt-6 pb-16">
      <Link href="/products" className="lp-eyebrow text-muted transition-colors hover:text-bone">
        ← Alla produkter
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">

        <div className="aspect-square overflow-hidden bg-tile">
          {image ? (
            <Image
              src={`/api/images/${image.id}`}
              alt={image.alt_text ?? product.name}
              width={800}
              height={800}
              priority
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="lp-eyebrow text-ink/30">Ingen bild</span>
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          {!product.is_active && (
            <p className="lp-eyebrow mb-4 inline-block border border-danger px-3 py-1 text-danger">
              Avaktiverad
            </p>
          )}

          {product.category_name && (
            <p className="lp-eyebrow mb-3 text-muted">{product.category_name}</p>
          )}

          <h1 className="lp-heading mb-4">{product.name}</h1>

          <div className="mb-8 flex items-baseline gap-3">
            <p className="text-xl">
              {formatPrice(product.current_price)} {currencyCode}
            </p>

            {isOnSale && (
              <p className="text-sm text-muted line-through">
                {formatPrice(product.standard_price)} {currencyCode}
              </p>
            )}
          </div>

          <AddToCartButton productId={product.id} isLoggedIn={user !== null} />

          {product.description && (
            <div className="mt-10 border-t border-line pt-8">
              <p className="whitespace-pre-line text-sm leading-relaxed text-bone/80">
                {product.description}
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="mt-10 border-t border-line pt-8">
              <Link href={`/products/${id}/edit`} className='lp-btn-ghost'>
                Redigera produkt
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
};
