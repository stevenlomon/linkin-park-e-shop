'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter(); // "Log out" är essentially 1. Gör en POST request till `/logout` och 2. Kör en `router.refresh()`!

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const res = await fetch('/api/logout', { method: 'POST' });

      if (!res.ok) {
        console.error('Utloggningen misslyckades. Försök igen om ett ögonblick', res.status);
        return;
      }

      // Liten paus så att utloggningen hinner kännas som något som händer, istället
      // för att navbaren byts ut i samma ögonblick som man klickar
      await new Promise((resolve) => setTimeout(resolve, 1800));

      // Uppdatera UI:n så att vi visar LoginForm igen!
      router.refresh();

    } catch (err) {
      console.error('Servern kunde inte nås vid utloggning:', err);  
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <button type='button' onClick={handleLogout} disabled={isLoggingOut} className="lp-btn-ghost py-2.5">
      {isLoggingOut ? 'Loggar ut…' : 'Logga ut'}
    </button>
  )
};