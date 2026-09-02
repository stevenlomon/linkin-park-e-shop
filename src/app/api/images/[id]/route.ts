import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Oxå 100% skriven av Claude nu på deadline day, oxå 100% värd att dissect i lugn och ro efter deadline
export async function GET(_req: Request, { params }: RouteContext<'/api/images/[id]'>) {
  try {
    const { id } = await params;
    const imageId = Number(id);

    if (!Number.isInteger(imageId)) {
      return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 });
    }

    const res = await pool.query<{ data: Buffer; mime_type: string }>(
      'SELECT data, mime_type FROM product_image WHERE id = $1',
      [imageId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Bilden hittades inte' }, { status: 404 });
    }

    const { data, mime_type } = res.rows[0];

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': mime_type,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Kunde inte hämta bilden:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

export async function DELETE(_req: Request, { params }: RouteContext<'/api/images/[id]'>) {
  try {
    const user = await getCurrentUser();
    if (user?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const imageId = Number(id);

    if (!Number.isInteger(imageId)) {
      return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 });
    }

    const res = await pool.query('DELETE FROM product_image WHERE id = $1', [imageId]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Bilden hittades inte' }, { status: 404 });
    }

    return NextResponse.json({ success: 'ok' });
  } catch (err) {
    console.error('Kunde inte radera bilden:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
