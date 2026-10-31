import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'linkin-park-product-images';
const TIMEOUT_MS = 10_000; // 10 sekunder timeout

// Samma lazy-init pattern som getStripe() och getClients()
function getSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

  if (!SUPABASE_URL || !SECRET_KEY) {
    throw new Error('Supabase env vars missing (SUPABASE_URL, SUPABASE_SECRET_KEY)');
  }

  return createClient(SUPABASE_URL, SECRET_KEY, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }),
    },
  });
}

// För att hålla det simpelt enligt labben fokuserar vi inte på webp och avid, utan bara på jpg och png
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export async function uploadProductImage(productId: number, buffer: Buffer, mimeType: string): Promise<{ path: string; url: string }> {
  const supabase = getSupabase();
  
  // Kod kommer här
  
  return { path: "kommer strax", url: "kommer strax" };
}