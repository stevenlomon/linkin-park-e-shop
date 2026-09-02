import { pool } from './db';
import { type Category } from './types';

export async function getAllLeafCategories(): Promise<Category[]> {
  // "Leaf Categories" är alla "barn": t.ex. hoodie under clothing. Det de alla har gemensamt är att parent_id inte är NULL
  const query = {
    name: 'fetch-all-leaf-categories',
    text: `
      SELECT id, name, parent_id
      FROM category
      WHERE parent_id IS NOT NULL
      ORDER BY name
    `
  }
  // console.log("leaf category query: ", query);

  const res = await pool.query(query);
  // console.log("leaf category res: ", res);
  return res.rows;
};

// Dessa kommer att användas på produktsidan!
export async function getAllParentCategories(): Promise<Category[]> {
  const query = {
    name: 'fetch-all-parent-categories',
    text: `
      SELECT id, name, parent_id
      FROM category
      WHERE parent_id IS NULL
      ORDER BY name
    `
  }

  const res = await pool.query(query);
  return res.rows;
};