import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getOrCreateCartId } from '@/lib/cart';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Du måste vara inloggad för att lägga till i varukorgen' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, quantity = 1} = body; // quantity har 1 som default

    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: 'Ogiltig produkt eller antal' }, { status: 400 });
    }

    const cartId = await getOrCreateCartId(user.id);

    const query = {
      name: 'add-to-cart',
      // Uppgraderad version av det jag tidigare skrev i working-log.md. Har aldrig sett EXCLUDED i mina 3 år 
      // av programmering, helt nytt för mig. Det blir verkligen att dissect mycket i denna kodbas efter deadline.
      text: `
        INSERT INTO carts_products (cart_id, product_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (cart_id, product_id)
        DO UPDATE SET quantity = carts_products.quantity + EXCLUDED.quantity
        RETURNING id, quantity
      `,
      values: [cartId, productId, quantity],
    };

    const res = await pool.query(query);
    return NextResponse.json({ success: 'ok', data: res.rows[0] });
  } catch (err) {
    console.error('Kunde inte lägga till i varukorgen:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};