import Link from 'next/link'
import { type Category } from '@/lib/types'

interface CategoryNavProps {
  parentCategories: Category[];
  leafCategories: Category[];
  activeCategoryId: number | null;
}

export default function CategoryNav({ parentCategories, leafCategories, activeCategoryId }: CategoryNavProps) {

  // Parent-kategorierna är rubriker, inte länkar
  const groups = parentCategories
    .map((parent) => ({
      parent,
      leaves: leafCategories.filter((leaf) => leaf.parent_id === parent.id),
    }))
    .filter((group) => group.leaves.length > 0);

  return (
    <nav aria-label="Kategorier" className="mb-10 border-b border-line pb-6">
      <div className="flex flex-wrap justify-left gap-x-14 gap-y-5">
        {groups.map(({ parent, leaves }) => (
          <div key={parent.id} className="text-left">
            {/* Rubriken är dämpad så att de klickbara löven är det ögat fastnar på */}
            <h2 className="lp-eyebrow mb-2 text-muted">{parent.name}</h2>

            <ul className="space-y-1">
              {leaves.map((leaf) => {
                const isActive = leaf.id === activeCategoryId;

                return (
                  <li key={leaf.id}>
                    <Link
                      href={`/products?category=${leaf.id}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={
                        isActive
                          ? 'block text-sm text-accent'
                          : 'block text-sm text-bone transition-colors hover:text-accent'
                      }
                    >
                      {leaf.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      </div>
    </nav>
  )
};
