import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Equivalent till en getAllProducts API funktion
export async function GET() {
  try {
    // For now skippar vi auth helt. getCurrentUser om det blir relevant kommer senare

    const query = {
      name: 'fetch-all-products',
      text: `SELECT * FROM product`,
    }

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows // Inte res.rows[0]; detta skulle bara ge vår första produkt haha!
    }); // This.. should be it? 😅 Vi testar i Postman haha!
    
  } catch (dbError) {
    console.error('Error fetching all products from database:', dbError);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500});
  }
};

// För att skapa produkter
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (user?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // En Product i vår databas vill ha name, description, standard_price, current_price, currency_id, category_id, 
    // Vår Postgres instance tar hand om id, is_active (default till true), och last_updated_at
    let { name, description, standard_price, current_price, currency_id, category_id } = body;

    if (!name || standard_price == null || current_price == null || !currency_id || !category_id) {
      return NextResponse.json({ error: "Missing required Product fields" }, { status: 400 });
    }

    description = description ?? '';
    console.log(`Received the following Product payload: name: ${name}, description: ${description}, standard_price: ${standard_price}, current_price: ${current_price}, currency_id: ${currency_id}, category_id: ${category_id}`);

    // Input data validation
    // Jag tänker att:
    // * name måste vara minst 3 karaktärer
    // * description måste vara max 1000 karaktärer? let's start with this

    const trimmedProductName = name.trim();
    if (trimmedProductName.length < 3) {
      return NextResponse.json({ error: "Product name cannot be less than 3 characters" }, { status: 400 });
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 1000) {
      return NextResponse.json({ error: "Product description cannot be more than 1000 characters" }, { status: 400 });
    }

    const query = {
      name: "insert-new-product",
      text: `
      INSERT INTO product (name, description, standard_price, current_price, currency_id, category_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      values: [name, description, standard_price, current_price, currency_id, category_id]
    }

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (err) {
    console.error("Unexpected error creating product:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};