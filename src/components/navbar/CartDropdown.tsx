'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { type CartItem } from '@/lib/types'

// Önskar att jag kunde få spendera lite tid med att handskriva denna komponent, men inte nu på deadline day
interface CartDropdownProps {
  items: CartItem[];
  itemCount: number;
}

function formatPrice(value: number) {
  return value.toFixed(2).replace('.', ',');
}

export default function CartDropdown({ items, itemCount }: CartDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleRemove(itemId: number) {
    setRemovingId(itemId);

    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.current_price) * item.quantity,
    0
  );
  const currencyCode = items[0]?.currency_code ?? 'SEK';

  return (
    <div ref={containerRef} className="relative">
      <button
        type='button'
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup='true'
        aria-label={`Varukorg, ${itemCount} ${itemCount === 1 ? 'artikel' : 'artiklar'}`}
        className="lp-nav-link flex items-center gap-2"
      >
        <svg
          aria-hidden='true'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          className="h-5 w-5"
        >
          <path d='M6 7h12l-1 13H7L6 7Z' strokeLinejoin='round' />
          <path d='M9 7V5a3 3 0 0 1 6 0v2' strokeLinecap='round' />
        </svg>

        <span>Varukorg</span>

        {itemCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-ink">
            {itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-4 w-80 border border-line bg-surface p-5 shadow-2xl">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Din varukorg är tom.
            </p>
          ) : (
            <>
              <ul className="mb-5 max-h-80 space-y-4 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.item_id} className="flex gap-3">
                    <Link
                      href={`/products/${item.product_id}`}
                      onClick={() => setIsOpen(false)}
                      className="h-16 w-16 shrink-0 overflow-hidden bg-tile"
                    >
                      {item.image_id ? (
                        <Image
                          src={`/api/images/${item.image_id}`}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.product_id}`}
                        onClick={() => setIsOpen(false)}
                        className="block truncate text-xs font-bold uppercase tracking-[0.1em] hover:text-accent"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-1 text-xs text-muted">
                        {item.quantity} × {formatPrice(Number(item.current_price))} {item.currency_code ?? 'SEK'}
                      </p>

                      <button
                        type='button'
                        onClick={() => handleRemove(item.item_id)}
                        disabled={removingId === item.item_id}
                        className="mt-1 text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-danger disabled:opacity-40"
                      >
                        {removingId === item.item_id ? 'Tar bort…' : 'Ta bort'}
                      </button>
                    </div>

                    <p className="shrink-0 text-xs">
                      {formatPrice(Number(item.current_price) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <span className="lp-eyebrow text-muted">Totalt</span>
                <span className="text-sm font-bold">
                  {formatPrice(total)} {currencyCode}
                </span>
              </div>

              <Link
                href='/checkout'
                onClick={() => setIsOpen(false)}
                className="lp-btn-primary mt-5 w-full"
              >
                Gå till kassan
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
};
