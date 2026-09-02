import { cookies } from 'next/headers';
import { pool } from './db';
import { type CurrentUser } from '@/lib/types';

export const SESSION_COOKIE = 'linkin-park-store-se-cookie';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  // Cookien är en string. Allt annat än ett heltal är skräp och ska avvisas
  const userId = Number(raw);
  if (!Number.isInteger(userId)) return null;

  // JOIN med vår role table så får vi role_name gratis
  const query = {
    name: 'fetch-current-user',
    text: `
      SELECT u.id, u.username, u.email, u.role_id, r.name AS role_name,
             u.fname, u.lname, u.street, u.city, u.postal_code, u.country
      FROM "User" u
      JOIN role r ON u.role_id = r.id
      WHERE u.id = $1
    `,
    values: [userId],
  };

  const res = await pool.query(query);
  return res.rows[0] ?? null;
};