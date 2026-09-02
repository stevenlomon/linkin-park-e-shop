import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST() {
  // "Log out" är så simpelt som att radera cookien för användaren!
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ success: 'ok' });
};