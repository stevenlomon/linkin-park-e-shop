import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateState, buildAuthURL } from '@/lib/integrations/auth/googleAdapter';

// När en användare klickar "Logga in med Google" ska denna starta OAuth flow:et. 
// Vi genererar state + PKCE, sparar dem i cookies, och redirectar till Google
export async function GET() {
  const state = generateState();
  const { url, codeVerifier } = await buildAuthURL(state);

  const cookieStore = await cookies();

  // När Google redirectar tillbaka till oss räknas det som cross-site navigation så våra cookie options blir viktiga!
  const OAuthFlowCookieOptions = {
    httpOnly: true, // Alltid httpOnly cookies så att de inte kan manipuleras med JS
    secure: process.env.NODE_ENV === 'production', // Tillåt HTTP vid localhost dev men alltid HTTPS i production
    sameSite: 'lax' as const, // `as const` behövs från TypeScript här. Från `'lax' | 'strict' | 'none'` vill vi ha `lax`, inte en generisk sträng
    path: '/api/auth/google',
    maxAge: 60 * 10, // 10 minuter ska räcka. Annars får användaren göra om och göra rätt
  };

  cookieStore.set('oauth_state', state, OAuthFlowCookieOptions);
  cookieStore.set('oauth_verifier', codeVerifier, OAuthFlowCookieOptions);

  return NextResponse.redirect(url);
}