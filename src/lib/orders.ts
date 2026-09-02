import { pool } from './db';
import { type AdminOrder, type ProfileStats } from './types';

export async function getAllOrders(userId?: number | null): Promise<AdminOrder[]> {
  const query = {
    name: 'fetch-orders',
    // Det här.. är en monster query 🙈 Men! Den använder `COALESCE`, `json_agg` och `json_build_object` och det har jag faktiskt 
    // brutit ner i en av filerna för Florilegium!
    text: `
      SELECT
        o.id,
        o.ordered_at,
        u.username,
        u.email,
        o.shipping_street,
        o.shipping_city,
        o.shipping_postal_code,
        o.shipping_country,
        COALESCE(SUM(op.quantity), 0)::int AS item_count,
        COALESCE(SUM(op.quantity * op.price_at_purchase), 0) AS total,
        COALESCE(
          json_agg(
            json_build_object(
              'name', p.name,
              'quantity', op.quantity,
              'price_at_purchase', op.price_at_purchase
            ) ORDER BY p.name
          ) FILTER (WHERE op.id IS NOT NULL),
          '[]'
        ) AS items
      FROM "Order" o
      LEFT JOIN "User" u           ON u.id = o.user_id
      LEFT JOIN orders_products op ON op.order_id = o.id
      LEFT JOIN product p          ON p.id = op.product_id
      WHERE ($1::int IS NULL OR o.user_id = $1)
      GROUP BY o.id, u.username, u.email
      ORDER BY o.ordered_at DESC
    `,
    values: [userId ?? null],
  }

  const res = await pool.query<AdminOrder>(query);
  return res.rows;
};

export async function getProfileStats(userId: number): Promise<ProfileStats | null> {
  const query = {
    name: 'fetch-profile-stats',
    text: `
      SELECT
        u.created_at,
        COUNT(DISTINCT o.id)::int AS order_count,
        COALESCE(SUM(op.quantity * op.price_at_purchase), 0) AS total_spent
      FROM "User" u
      LEFT JOIN "Order" o           ON o.user_id = u.id
      LEFT JOIN orders_products op  ON op.order_id = o.id
      WHERE u.id = $1
      GROUP BY u.created_at
    `,
    values: [userId],
  }

  const res = await pool.query<ProfileStats>(query);
  return res.rows[0] ?? null;
};
