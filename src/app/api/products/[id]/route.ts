import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: RouteContext<'/api/products/[id]'>) {
  try {
    // Endast Admin ska kunna ändra produkter!
    const user = await getCurrentUser();
    if (user?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, standardPrice, currentPrice, currencyId, categoryId, isActive } = body;

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Namn krävs' }, { status: 400 });
    }

    // Det här är första gången jag nånsin ser `.isFinite()`. Bra att känna till!!
    if (!Number.isFinite(standardPrice) || !Number.isFinite(currentPrice)) {
      return NextResponse.json({ error: 'Ogiltiga priser' }, { status: 400 });
    }

    if (standardPrice < 0 || currentPrice < 0) {
      return NextResponse.json({ error: 'Priser kan inte vara negativa' }, { status: 400 });
    }

    const query = {
      name: 'update-product',
      // last_updated_at sätts explicit med CURRENT_TIMESTAMP så att den faktiskt betyder "senast ändrad" och inte "just skapad"
      text: `
        UPDATE product
        SET name = $1,
            description = $2,
            standard_price = $3,
            current_price = $4,
            currency_id = $5,
            category_id = $6,
            is_active = $7,
            last_updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING id, name, is_active
      `,
      values: [
        name.trim(),
        description ?? null,
        standardPrice,
        currentPrice,
        currencyId ?? null,
        categoryId ?? null,
        Boolean(isActive),
        productId,
      ],
    };

    const res = await pool.query(query);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Produkten hittades inte' }, { status: 404 });
    }

    return NextResponse.json({ success: 'ok', data: res.rows[0] });
  } catch (err) {
    console.error('Kunde inte uppdatera produkten:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
