import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getOrCreateCartId } from '@/lib/cart';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, quantity = 1} = body; // quantity har 1 som default

    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: 'Ogiltig produkt eller antal' }, { status: 400 });
    }

    const cartId = await getOrCreateCartId();

    const query = {
      name: 'add-to-cart',
      // Tech debt clean-up; let's unpack EXCLUDED!
      // EXCLUDED refererar till rader som *skulle* lagras i databasen men stötte på en konflikt. I detta scenario
      // blir det relevant eftersom vi har en unique constraint på (cart_id, product_id). Så när en till av samma 
      // produkt läggs till kickar ON CONFLICT in och kör DO UPDATE raden.
      // EXCLUDED har alla värden från vår INSERT så EXCLUDED.cart_id och EXCLUDED.product_id finns också. Men det
      // är endast EXCLUDED.quantity som är relevant i detta fall. Och det är denna som används i SET raden. Allt 
      // som allt är detta vad vi kallar en UPSERT; "INSERT om det inte finns, UPDATE om det redan finns"
      text: `
        INSERT INTO 
          carts_products (cart_id, product_id, quantity)
            VALUES ($1, $2, $3)
        ON CONFLICT (cart_id, product_id)
          DO UPDATE 
            SET quantity = carts_products.quantity + EXCLUDED.quantity
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