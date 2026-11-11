import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateState, buildAuthURL } from '@/lib/integrations/auth/googleAdapter';

// När en användare klickar "Logga in med Google" ska denna starta OAuth flow:et. 
// Vi genererar state + PKCE, sparar dem i cookies, och redirectar till Google
export async function GET() {
 // Kod kommer här
}