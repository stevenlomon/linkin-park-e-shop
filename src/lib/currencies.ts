import { pool } from './db';
import { type Currency } from './types';
import { cookies } from 'next/headers';

// Server Components måste rendera sidan innan JS körs i browsern. För att få med användar specific data som "vilken valuta
// föredrar dem?" använder vi cookies! Vi gör även detta med SESSION_COOKIE och GUEST_CART_COOKIE, *nu* gör det sense
export const CURRENCY_COOKIE = 'linkin-park-currency-preference';

const ALLOWED_CURRENCIES = ['SEK', 'EUR', 'USD', 'GBP'];

export async function getAllCurrencies(): Promise<Currency[]> {
  const query = {
    name: 'fetch-all-currencies',
    text: `SELECT id, name FROM currency ORDER BY name`,
  }

  const res = await pool.query<Currency>(query);
  return res.rows;
};

export async function getSelectedCurrency(): Promise<string> {
  // Innan nånting annat; kolla cookie om en finns! Om vi inte har ett cookie värde
  // returneras `undefined`
  const raw = (await cookies()).get(CURRENCY_COOKIE)?.value;

  // Validera mot vår allow list. Allt annat (skräp, manipulation etc) -> fallback SEK
  // I.e. om vi har ett värde som finns i vår allow list från cookie, returnera. Annars 'SEK'
  return raw && ALLOWED_CURRENCIES.includes(raw) ? raw : 'SEK';
}

// Helper funktion för att visa priser i andra valutor i bl.a. ProductCard. Alla priser i databasen lagras i SEK, och rates från 
// Frankfurter är relativa till SEK, så konverteringen är alltid SEK → vald valuta.
// Tar `string | number` eftersom pg returnerar numeric som string
export function convertPrice(sekPrice: string | number, rates: Record<string, number>, targetCurrency: string): number {
  // Om vi får priset som en sträng, konvertera till Number först
  const amount = typeof sekPrice === 'string' ? Number(sekPrice) : sekPrice;

  const rate = rates[targetCurrency] ?? 1;
  return amount * rate;
}