import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Equivalent till en getAllCategories API funktion (straight up kopia av getAllProducts haha)
export async function GET() {
  try {
    const query = {
      name: 'fetch-all-categories',
      text: `SELECT * FROM category`,
    }

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows
    });
    
  } catch (dbError) {
    console.error('Error fetching all categories from database:', dbError);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500});
  }
};