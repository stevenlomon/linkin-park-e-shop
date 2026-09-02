'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter(); // För router.refresh()!

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Förhindra full page refresh
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        // 401 = fel användarnamn eller lösenord. Och här kommer jag ihåg diskussionen under en föreläsning; vilket felmeddelande man vill ge
        // är en balansgång mellan säkerhet och UX!!
        // För högsta säkerhet: 'Fel användarnamn *eller* lösenord'. Ge medvetet så lite information som möjligt
        // För högsta UX: 'Fel användarnamn' eller 'Fel lösenord' baserat på vilken som är fel. Ge så mycket information som möjligt
        // Bara för att jag ändå inte prioriterar säkerhet hahahaha tänker jag som medvetet val och full acknowledgement prioritera UX här!
        if (res.status !== 401) {
          setError('Något gick fel. Försök igen.');
          return;
        } else {
          const data = await res.json();
          setError(data.reason === 'username'
            ? 'Det finns ingen användare med det användarnamnet.'
            : 'Fel lösenord.');
          return;
        }
      }

      // Vi är inloggad! Kör en router refresh så att vi ser "inloggad UI" utan full page refresh!
      router.refresh();
      setUsername("");
      setPassword("");

    } catch {
      // Nätverksfel! `fetch` hann aldrig fram till servern
      setError('Kunde inte nå servern. Kontrollera din uppkoppling och försök igen');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

        <div className="sm:w-40">
          <label htmlFor='username' className="lp-label">Användarnamn</label>
          <input
            id='username'
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete='username'
            className="lp-input py-2"
            required
          />
        </div>

        <div className="sm:w-40">
          <label htmlFor='password' className="lp-label">Lösenord</label>
          {/* Jag är on and on med hur jag inte prioriterar säkerhet i detta projekt men denna ska iaf ha `type='password'` hahahah */}
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete='current-password'
            className="lp-input py-2"
            required
          />
        </div>

        <button type='submit' disabled={isSubmitting} className="lp-btn-primary py-2.5">
          {isSubmitting ? 'Loggar in..' : 'Logga in'}
        </button>
      </div>

      {error && (
        <p role='alert' className="text-xs text-danger sm:text-right">{error}</p>
      )}
    </form>
  )
};
