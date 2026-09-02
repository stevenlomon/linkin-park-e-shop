export interface CurrentUser {
  id: number;
  username: string;
  email: string;

  // Dessa två är inte nullable i databasen längre och därmed inte `| null` här
  role_id: number;   // 1 är 'admin', 2 är 'customer'
  role_name: string;

  fname: string | null;
  lname: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}
// current_price är `numeric` i Postgres, och pg lämnar tillbaka numeric som *sträng*
// för att inte tappa precision. Därav string och inte number här
export interface ProductListItem {
  id: number;
  name: string;
  current_price: string;
  currency_code: string | null;
  image_id: number | null;
  image_alt_text: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  standard_price: string;
  current_price: string;
  currency_id: number | null;
  category_id: number | null;
  is_active: boolean;
}

export interface CartItem {
  item_id: number;        // carts_products.id
  product_id: number;
  name: string;
  quantity: number;
  current_price: string;  // numeric → sträng från pg
  currency_code: string | null;
  image_id: number | null; // för thumbnail i kundkorgen
}
export interface Currency {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  mime_type: string;
  alt_text: string | null;
  size_bytes: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string | null;
  standard_price: string;
  current_price: string;
  currency_code: string | null;
  category_name: string | null;
  is_active: boolean;
}

export interface AdminOrderItem {
  name: string;
  quantity: number;
  price_at_purchase: number;
}

export interface AdminOrder {
  id: number;
  ordered_at: Date;
  username: string | null;
  email: string | null;
  shipping_street: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  item_count: number;
  total: string;
  items: AdminOrderItem[];
}

export interface ProfileStats {
  created_at: Date;
  order_count: number;
  total_spent: string;
}
