import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

// 100% skriven av Claude nu på deadline day. Värd att dissect i lugn och ro efter deadline
export async function POST(req: Request, { params }: RouteContext<'/api/products/[id]/images'>) {
  try {
    const user = await getCurrentUser();
    if (user?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 });
    }

    const exists = await pool.query('SELECT 1 FROM product WHERE id = $1', [productId]);
    if (exists.rowCount === 0) {
      return NextResponse.json({ error: 'Produkten hittades inte' }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Ingen bild bifogad' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Filformatet stöds inte' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Bilden är för stor. Max 4 MB' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const rawAltText = form.get('altText');
    const altText = typeof rawAltText === 'string' && rawAltText.trim() !== '' ? rawAltText.trim() : null;

    const query = {
      name: 'upsert-product-image',
      text: `
        INSERT INTO product_image (product_id, data, mime_type, alt_text, size_bytes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (product_id)
        DO UPDATE SET data = EXCLUDED.data,
                      mime_type = EXCLUDED.mime_type,
                      alt_text = EXCLUDED.alt_text,
                      size_bytes = EXCLUDED.size_bytes
        RETURNING id, mime_type, alt_text, size_bytes
      `,
      values: [productId, bytes, file.type, altText, file.size],
    };

    const res = await pool.query(query);
    return NextResponse.json({ success: 'ok', data: res.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Kunde inte ladda upp bilden:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};