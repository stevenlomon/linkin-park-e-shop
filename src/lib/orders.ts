import { pool } from './db';
import { type AdminOrder, CustomerOrder } from './types';

export async function getAllOrders(): Promise<AdminOrder[]> {
  const query = {
    name: 'fetch-orders',
    // Det här.. är en monster query 🙈 Men! Den använder `COALESCE`, `json_agg` och `json_build_object` och det har jag faktiskt 
    // brutit ner i en av filerna för Florilegium!
    text: `
      SELECT
        o.id,
        o.ordered_at,
        o.status, -- Vi hämtar nu också status!
        u.username,
        u.email,
        o.guest_name,
        o.guest_email,
        o.shipping_street,
        o.shipping_city,
        o.shipping_postal_code,
        o.shipping_country,
        o.shipping_method,
        o.shipping_price,
        o.service_point_id,
        o.service_point_name,
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

export async function getOrdersByUser(userId: number): Promise<CustomerOrder[]> {
  // Exakt samma aggregation logik som i admin queryn ovan. Men utan User table JOIN eftersom vi inte behöver hämta username,
  // email etc etc + vi måste använda `WHERE o.user_id = $1` av säkerhets skäl. Vi vill bara visa den inloggade användarens ordrar!
  const query = {
    name: 'fetch-user-orders',
    text: `
      SELECT
        o.id,
        o.ordered_at,
        o.status,
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
      LEFT JOIN orders_products op ON op.order_id = o.id
      LEFT JOIN product p          ON p.id = op.product_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.ordered_at DESC
    `,
    values: [userId],
  };

  const res = await pool.query<CustomerOrder>(query);
  return res.rows;
}