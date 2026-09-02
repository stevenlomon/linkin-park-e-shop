'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AddToCartButtonProps {
  productId: number;
  isLoggedIn: boolean;
}

// Denna är väldigt värd att break down och dissect i lugn och ro efter deadline
export default function AddToCartButton({ productId, isLoggedIn }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const router = useRouter();

  function focusLogin() {
    document.getElementById('username')?.focus();
  }

  async function handleAddToCart() {
    setError(null);
    setJustAdded(false);
    setIsAdding(true);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!res.ok) {
        setError(res.status === 401
          ? 'Du måste vara inloggad för att handla.'
          : 'Kunde inte lägga till i varukorgen.');
        return;
      }

      setJustAdded(true);
      router.refresh();
    } catch {
      setError('Kunde inte nå servern. Försök igen.');
    } finally {
      setIsAdding(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div>
        <button type='button' onClick={focusLogin} className="lp-btn-primary w-full sm:w-auto">
          Logga in för att handla
        </button>
        <p className="mt-6 text-xs text-muted">
          Du hittar inloggningen längst upp till höger. Testanvändare finns på{' '}
          <Link href="/about" className="text-accent underline underline-offset-4">om-sidan</Link>.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="lp-label">Antal</p>

      <div className="mb-6 inline-flex items-center border border-line">
        <button
          type='button'
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          aria-label='Minska antal'
          className="px-4 py-3 text-bone transition-colors hover:text-accent disabled:opacity-30"
        >
          −
        </button>

        <span aria-live='polite' className="min-w-10 text-center text-sm">{quantity}</span>

        <button
          type='button'
          onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          disabled={quantity >= 99}
          aria-label='Öka antal'
          className="px-4 py-3 text-bone transition-colors hover:text-accent disabled:opacity-30"
        >
          +
        </button>
      </div>

      <button
        type='button'
        onClick={handleAddToCart}
        disabled={isAdding}
        className="lp-btn-primary w-full"
      >
        {isAdding ? 'Lägger till…' : 'Lägg i varukorg'}
      </button>

      {error && <p role='alert' className="mt-3 text-sm text-danger">{error}</p>}

      {justAdded && !error && (
        <p role='status' className="mt-3 text-sm text-accent">
          Tillagd i varukorgen.
        </p>
      )}
    </div>
  )
};
