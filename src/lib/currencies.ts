import { pool } from './db';
import { type Currency } from './types';

export async function getAllCurrencies(): Promise<Currency[]> {
  const query = {
    name: 'fetch-all-currencies',
    text: `SELECT id, name FROM currency ORDER BY name`,
  }

  const res = await pool.query<Currency>(query);
  return res.rows;
};
