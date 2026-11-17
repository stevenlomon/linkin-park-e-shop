import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrdersByUser } from '@/lib/orders';

// Super simpel route handler för att fetch:a ordar för en inloggad användare
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await getOrdersByUser(user.id);
  return NextResponse.json(orders);
}