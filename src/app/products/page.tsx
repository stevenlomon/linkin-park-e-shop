import { getAllActiveProducts } from '@/lib/products'
import { getAllLeafCategories, getAllParentCategories } from '@/lib/categories';
import CategoryNav from '@/components/products/CategoryNav'
import ProductCard from '@/components/products/ProductCard'

export const dynamic = 'force-dynamic';

// Allt som inte är ett heltal behandlas som "inget filter" istället för att krascha sidan
function parseCategoryId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;

  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

export default async function AllProductsPage({ searchParams }: PageProps<'/products'>) {
  const activeCategoryId = parseCategoryId((await searchParams).category);

  // De tre hämtningarna är oberoende av varandra, så vi kör dem parallellt
  // istället för att vänta in dem en i taget
  const [leafCategories, parentCategories, products] = await Promise.all([
    getAllLeafCategories(),
    getAllParentCategories(),
    getAllActiveProducts(activeCategoryId),
  ]);

  // Rubriken speglar filtret. Vi slår upp namnet i listan vi redan hämtat
  // istället för att fråga databasen en gång till
  const activeCategory = leafCategories.find((c) => c.id === activeCategoryId);

  return (
    <div className="lp-container pt-6 pb-16">
      <CategoryNav
        parentCategories={parentCategories}
        leafCategories={leafCategories}
        activeCategoryId={activeCategoryId}
      />

      {products.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          {activeCategory
            ? `Inga produkter i ${activeCategory.name} än.`
            : 'Inga produkter att visa än.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
};