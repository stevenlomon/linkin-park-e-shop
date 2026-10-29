import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { indexProducts, removeProduct, type AlgoliaProduct } from '@/lib/integrations/search/algoliaAdapter';

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
      // NEW: RETURNING expanderad för att kunna synka upp med Algolia när vi ändrar en produkt!
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
        RETURNING id, name, current_price, category_id, stock, variants, supplier_sku, is_active
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

    // För att kunna synka med Algolia behöver vi nu alla produkter som uppdaterades!
    const updated = res.rows[0];

    // Synka med Algolia om produkten endast om den kom från import, d.v.s om supplier_sku finns
    // Manuellt skapade produkter utan sku indexeras inte eftersom de inte har supplier_sku
    if (updated.supplier_sku) {
      try {
        // Om produkten fortfarande är aktiv; indexera och uppdatera
        if (updated.is_active) {
          await indexProducts([{
            objectID: updated.supplier_sku,
            id: updated.id,
            name: updated.name,
            current_price: Number(updated.current_price),
            category_id: updated.category_id,
            stock: updated.stock ?? 0,
            variants: updated.variants,
          }]);
        } else {
          // Om produkten inte är aktiv länge; ta bort från indexeringen och sökresultat! Detta är vår ekvivalent till en DELETE route
          await removeProduct(updated.supplier_sku);
        }
      } catch (err) {
        console.error('Algolia sync failed after product update:', err);
      }
    }

    return NextResponse.json({ success: 'ok', data: res.rows[0] });
  } catch (err) {
    console.error('Kunde inte uppdatera produkten:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
