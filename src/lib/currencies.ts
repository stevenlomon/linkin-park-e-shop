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