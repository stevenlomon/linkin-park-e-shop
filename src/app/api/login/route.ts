import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { username, password } = body;

    // Lösenordet jämförs direkt i SQL eftersom vi lagrar det direkt unhashed. Once again; *jag vet* att vi ALDRIG skulle
    // göra detta i produktion för ett riktigt projekt av säkerhetsskäl
    // Ändrar lite här nu för att visa ifall username eller password är fel!
    const query = {
      name: 'login-user',
      // password måste med i SELECT-listan — det är den vi jämför mot på raden nedan.
      // Utan den är user.password undefined och *alla* inloggningar failar som "fel lösenord"
      text: `SELECT id, username, password FROM "User" WHERE username = $1`,
      values: [username],
    };

    const res = await pool.query(query);
    const user = res.rows[0];

    // Inget användarnamn matchade
    if (!user) {
      return NextResponse.json({ success: 'not ok', reason: 'username' }, { status: 401 });
    }

    // Användarnamnet fanns, men lösenordet stämmer inte
    if (user.password !== password) {
      return NextResponse.json({ success: 'not ok', reason: 'password' }, { status: 401 });
    }

    // Här sätter vi cookien i användarens Browser!
    (await cookies()).set(SESSION_COOKIE, String(user.id), {
      httpOnly: true,                                 // JS kan inte läsa cookien (XSS)
      secure: process.env.NODE_ENV === 'production',  // kräv HTTPS i produktion
      sameSite: 'lax',                                // CSRF-skyff
      path: '/',
      maxAge: 60 * 60 * 24 * 7,                       // 7 dagar
    });

    return NextResponse.json({ success: 'ok', data: { id: user.id, username: user.username } });

  } catch (err) {
    console.error('Unexpected error when trying to sign in', err);
    return NextResponse.json({ success: 'not ok' }, { status: 500 });
  }
};