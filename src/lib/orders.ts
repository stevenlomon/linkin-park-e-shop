import { pool } from './db';
import { type AdminOrder } from './types';

export async function getAllOrders(): Promise<AdminOrder[]> {
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
        o.guest_name,
        o.guest_email,
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
      GROUP BY o.id, u.username, u.email
      ORDER BY o.ordered_at DESC
    `,
  }

  const res = await pool.query<AdminOrder>(query);
  return res.rows;
};
