import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, decodeAndValidateIdToken } from '@/lib/integrations/auth/googleAdapter';
import { pool } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Det är hit Goole redirectar. Validera, byt `code` mot tokens, avkoda Google's JWT, upsert på Google användaren och skapa 
// en session i vårt fall (jag använder inte JWT i shoppen)
export async function GET(req: Request) {
  // Kod kommer här
}