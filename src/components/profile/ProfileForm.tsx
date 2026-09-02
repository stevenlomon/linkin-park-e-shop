'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type CurrentUser } from '@/lib/types'

interface ProfileFormProps {
  user: CurrentUser;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [fname, setFname] = useState(user.fname ?? '');
  const [lname, setLname] = useState(user.lname ?? '');
  const [street, setStreet] = useState(user.street ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [postalCode, setPostalCode] = useState(user.postal_code ?? '');
  const [country, setCountry] = useState(user.country ?? '');

  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSavedAt(false);
    setIsSaving(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fname, lname, street, city, postalCode, country }),
      });

      if (!res.ok) {
        setError('Kunde inte spara dina uppgifter. Försök igen.');
        return;
      }

      setSavedAt(true);
      router.refresh();
    } catch {
      setError('Kunde inte nå servern. Kontrollera din uppkoppling och försök igen.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor='fname' className="lp-label">Förnamn</label>
          <input id='fname' type='text' value={fname} onChange={(e) => setFname(e.target.value)} autoComplete='given-name' className="lp-input" />
        </div>

        <div>
          <label htmlFor='lname' className="lp-label">Efternamn</label>
          <input id='lname' type='text' value={lname} onChange={(e) => setLname(e.target.value)} autoComplete='family-name' className="lp-input" />
        </div>
      </div>

      <div>
        <label htmlFor='street' className="lp-label">Gatuadress</label>
        <input id='street' type='text' value={street} onChange={(e) => setStreet(e.target.value)} autoComplete='street-address' className="lp-input" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor='postal-code' className="lp-label">Postnummer</label>
          <input id='postal-code' type='text' value={postalCode} onChange={(e) => setPostalCode(e.target.value)} autoComplete='postal-code' className="lp-input" />
        </div>

        <div>
          <label htmlFor='city' className="lp-label">Ort</label>
          <input id='city' type='text' value={city} onChange={(e) => setCity(e.target.value)} autoComplete='address-level2' className="lp-input" />
        </div>
      </div>

      <div>
        <label htmlFor='country' className="lp-label">Land</label>
        <input id='country' type='text' value={country} onChange={(e) => setCountry(e.target.value)} autoComplete='country-name' className="lp-input" />
      </div>

      {error && <p role='alert' className="text-sm text-danger">{error}</p>}

      {savedAt && !error && (
        <p role='status' className="text-sm text-accent">Dina uppgifter är sparade.</p>
      )}

      <button type='submit' disabled={isSaving} className="lp-btn-primary">
        {isSaving ? 'Sparar…' : 'Spara uppgifter'}
      </button>

      <p className="text-xs text-muted">
        Uppgifterna fylls i automatiskt i kassan. Fyller du i dem där sparas de hit.
      </p>
    </form>
  )
};
