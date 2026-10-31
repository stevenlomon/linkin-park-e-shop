import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { getProductDetail } from '@/lib/products';
import { getProductImage } from '@/lib/productImage';
import { getExchangeRates } from '@/lib/integrations/currencyAdapter';
import { getSelectedCurrency, convertPrice } from '@/lib/currencies';
import AddToCartButton from '@/components/products/AddToCartButton';

export const dynamic = 'force-dynamic';

// Tech debt clean-up; let's unpack `PageProps<AppRoute>` vs `RouteContext<AppRouteHandlerRoute>`!
// Super simplifierat:
// `PageProps<AppRoute>` -> används i page.tsx filer.
// `RouteContext<AppRouteHandlerRoute>` -> används i route.ts filer. 
// Dessa är två generated helpers som Next.js erbjuder oss. What trips me up är att jag aldrig sett dem. Jag  är van med 
// t.ex. `export default async function DetailedViewPage({ params }: { params: Promise<{ id: string }> }) {` (från Florilegium). 
// Om jag förstår rätt så ger `PageProps<'/products/[id]'>` oss `{ params: Promise<{ id: string }> }` automatiskt. 
// Med andra ord: `{ params }: PageProps<'/products/[id]'>` === `{ params }: { params: Promise<{ id: string }> }`
// För RouteContext: `req: Request, ctx: RouteContext<'/api/cart/[itemId]'>` === `req: Request, ctx: { params: Promise<{ itemId: string }> }`
// I Florilegium har jag inga dynamic segments med [id] i någon av mina routes och därför jag endast req behövs som parameter i
// de Route Handlers. Här har vi `/api/cart/[itemId]/route.ts` vilket är stora skillnaden
// Tror jag föredrar att skriva ut allting explicitly som jag gjort i Florilegium av ren vana.
// Fördelen med att använda Next.js's generated helpers är att de automatiskt synkar ifall vi döper om vår route. 
// Men nu vet jag! Jag får låta allt detta marinera och göra det arkitektuella valet nästa projekt jag bygger i Next.js
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
  const [rates, selectedCurrency] = await Promise.all([
    getExchangeRates(),
    getSelectedCurrency(),
  ]);
  
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

          {/* Nu med vår dynamiska valuta omväxling integrerad! */}
          <div className="mb-8 flex items-baseline gap-3">
            <p className="text-xl">
              {convertPrice(product.current_price, rates.rates, selectedCurrency).toFixed(2).replace('.', ',')} {selectedCurrency}
            </p>

            {isOnSale && (
              <p className="text-sm text-muted line-through">
                {convertPrice(product.standard_price, rates.rates, selectedCurrency).toFixed(2).replace('.', ',')} {selectedCurrency}
              </p>
            )}
          </div>

          {/* NEW: Lagersaldo! */}
          {product.stock !== null && (
            <p className="mb-8 text-sm text-muted">
              {product.stock > 0
                ? `${product.stock} i lager`
                : 'Slut i lager'}
            </p>
          )}

          <AddToCartButton productId={product.id} />

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
