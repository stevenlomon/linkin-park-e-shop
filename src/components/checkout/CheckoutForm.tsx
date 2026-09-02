'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type CurrentUser } from '@/lib/types'

interface CheckoutFormProps {
  user: CurrentUser;
}

const SPINNER_MS = 3400;

export default function CheckoutForm({ user }: CheckoutFormProps) {
  const [fname, setFname] = useState(user.fname ?? '');
  const [lname, setLname] = useState(user.lname ?? '');
  const [street, setStreet] = useState(user.street ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [postalCode, setPostalCode] = useState(user.postal_code ?? '');
  const [country, setCountry] = useState(user.country ?? 'Sverige');

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
        body: JSON.stringify({ fname, lname, street, city, postalCode, country }),
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
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor='fname' className="lp-label">Förnamn</label>
            <input id='fname' type='text' value={fname} onChange={(e) => setFname(e.target.value)} autoComplete='given-name' className="lp-input" required />
          </div>

          <div>
            <label htmlFor='lname' className="lp-label">Efternamn</label>
            <input id='lname' type='text' value={lname} onChange={(e) => setLname(e.target.value)} autoComplete='family-name' className="lp-input" required />
          </div>
        </div>

        <div>
          <label htmlFor='email' className="lp-label">E-post</label>
          <input id='email' type='email' value={user.email} readOnly disabled className="lp-input opacity-60" />
          <p className="mt-2 text-xs text-muted">Din e-post ändras på profilsidan.</p>
        </div>

        <div>
          <label htmlFor='street' className="lp-label">Gatuadress</label>
          <input id='street' type='text' value={street} onChange={(e) => setStreet(e.target.value)} autoComplete='street-address' className="lp-input" required />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor='postal-code' className="lp-label">Postnummer</label>
            <input id='postal-code' type='text' value={postalCode} onChange={(e) => setPostalCode(e.target.value)} autoComplete='postal-code' className="lp-input" required />
          </div>

          <div>
            <label htmlFor='city' className="lp-label">Ort</label>
            <input id='city' type='text' value={city} onChange={(e) => setCity(e.target.value)} autoComplete='address-level2' className="lp-input" required />
          </div>
        </div>

        <div>
          <label htmlFor='country' className="lp-label">Land</label>
          <input id='country' type='text' value={country} onChange={(e) => setCountry(e.target.value)} autoComplete='country-name' className="lp-input" required />
        </div>

        {error && <p role='alert' className="text-sm text-danger">{error}</p>}

        <button type='submit' disabled={isProcessing} className="lp-btn-primary w-full">
          {isProcessing ? 'Behandlar…' : 'Köp'}
        </button>

        <p className="text-xs text-muted">
          Det här är ett skolprojekt. Ingen betalning genomförs och inget skickas.
        </p>
      </form>
    </>
  )
};
