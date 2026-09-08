'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type CurrentUser } from '@/lib/types'

interface CheckoutFormProps {
  user: CurrentUser | null;
}

const SPINNER_MS = 3400;

export default function CheckoutForm({ user }: CheckoutFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Kunde inte slutföra köpet. Försök igen.');
        setIsProcessing(false);
        return;
      }

      const { data } = await res.json();

      await new Promise((resolve) => setTimeout(resolve, SPINNER_MS));

      router.push(`/thank-you?order=${data.orderId}`);
      router.refresh();
    } catch {
      setError('Kunde inte nå servern. Kontrollera din uppkoppling och försök igen.');
      setIsProcessing(false);
    }
  }

  return (
    <>
      {isProcessing && (
        <div
          role='status'
          aria-live='assertive'
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink/95"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="lp-eyebrow text-muted">Behandlar din order…</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor='name' className="lp-label">Namn</label>
          <input
            id='name'
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete='name'
            className="lp-input"
            required
          />
        </div>

        <div>
          <label htmlFor='email' className="lp-label">E-post</label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete='email'
            className="lp-input"
            required
          />
          <p className="mt-2 text-xs text-muted">
            Din orderbekräftelse skulle skickas hit.
          </p>
        </div>

        {error && <p role='alert' className="text-sm text-danger">{error}</p>}

        <button type='submit' disabled={isProcessing} className="lp-btn-primary w-full sm:w-auto">
          {isProcessing ? 'Behandlar…' : 'Slutför köp'}
        </button>

        <p className="text-xs text-muted">
          Det här är ett skolprojekt. Ingen betalning genomförs och inget skickas.
        </p>
      </form>
    </>
  )
};
