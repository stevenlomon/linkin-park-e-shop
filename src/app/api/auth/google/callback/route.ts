import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, decodeAndValidateIdToken } from '@/lib/integrations/auth/googleAdapter';
import { pool } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Det är hit Goole redirectar. Validera, byt `code` mot tokens, avkoda Google's JWT, upsert på Google användaren och skapa 
// en session i vårt fall (jag använder inte JWT i shoppen)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('oauth_state')?.value; // Expected state i en cookie! En av de grejorna jag snappade upp tydligast under föreläsningen haha
  const codeVerifier = cookieStore.get('oauth_verifier')?.value;
  
  // OAuth flow cookies är one time use och rensas regardless of outcome
  const clearOptions = { path: '/api/auth/google' };
  cookieStore.delete({ name: 'oauth_state', ...clearOptions });
  cookieStore.delete({ name: 'oauth_verifier', ...clearOptions });

  // Det är även därför vi väntar med att kolla error här, *efter* att vi läst och rensat cookies
  if (error) {
    return NextResponse.redirect(`${APP_URL}/?error=cancelled`);
  }

  // Kolla bl.a. så att state matchar
  if (!code || !expectedState || !codeVerifier || state !== expectedState) {
    return NextResponse.redirect(`${APP_URL}/?error=state`);
  }

  try {
    // Byt vår authorization code mot tokens och därefter avkoda och validera Googles JWT
    // Så många rader kod i vår adapter och endast två rader här, otroligt satisfying
    const { idToken } = await exchangeCodeForTokens(code, codeVerifier);
    const googleUser = decodeAndValidateIdToken(idToken);

    // UPSERT via ON CONFLICT på Googles unika ID `sub`
    // role_id är statiskt 2; endast kunder ska kunna logga in med Google. Admin loggar in med GitHub i nästa labb!
    const result = await pool.query<{ id: number }>(
      `INSERT INTO "User" (google_sub, email, username, password, auth_provider, role_id)
       VALUES ($1, $2, $3, NULL, 'google', 2)
       ON CONFLICT (google_sub) DO UPDATE
         SET email = EXCLUDED.email, username = EXCLUDED.username
       RETURNING id`,
      [googleUser.sub, googleUser.email, googleUser.name ?? googleUser.email],
    );

    const userId = result.rows[0].id;

    // Allra sist skapar vi en session; samma cookie som vanlig inloggning.
    // Viktigt här tydligen är Googles tokens *inte* ska sparas. De har gjort sitt jobb nu
    cookieStore.set(SESSION_COOKIE, String(userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dagar, samma som vanlig login
    });

    return NextResponse.redirect(APP_URL);
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    return NextResponse.redirect(`${APP_URL}/?error=google`);
  }
}