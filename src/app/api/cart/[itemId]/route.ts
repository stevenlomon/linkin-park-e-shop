import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Har aldrig sett RouteContext innan. Tydligen är det equivalent med `{ params: Promise<{ itemId: string }> }`
export async function PATCH(req: Request, ctx: RouteContext<'/api/cart/[itemId]'>) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Du måste vara inloggad' }, { status: 401 });

  const body = await req.json();

  const { itemId } = await ctx.params;   // itemdId från URL params
  const { quantity } = body;             // Och quantity från POST request!

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: 'Ogiltigt antal' }, { status: 400 });
  }

  const query = {
    name: 'update-cart-item',
    // WHERE-delen är superviktig här av säkerhetsskäl; det är den som ser till att vi endast kan ändra *vår* kundvagn!
    text: `
      UPDATE carts_products cp
      SET quantity = $1
      FROM cart c
      WHERE cp.id = $2 AND cp.cart_id = c.id AND c.user_id = $3
    `,
    values: [quantity, Number(itemId), user.id],
  };

  const res = await pool.query(query);

  // 0 rader = finns inte, eller tillhör någon annan. Vi svarar likadant i båda
  // fallen så att ingen kan kartlägga andras varukorgar
  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });
  }

  return NextResponse.json({ success: 'ok' });
};

export async function DELETE(req: Request, ctx: RouteContext<'/api/cart/[itemId]'>) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Du måste vara inloggad' }, { status: 401 });

  const { itemId } = await ctx.params;

  const query = {
    name: 'delete-cart-item',
    text: `
      DELETE FROM carts_products cp
      USING cart c
      WHERE cp.id = $1 AND cp.cart_id = c.id AND c.user_id = $2
    `,
    values: [Number(itemId), user.id],
  };

  const res = await pool.query(query);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });
  }

  return NextResponse.json({ success: 'ok' });
};