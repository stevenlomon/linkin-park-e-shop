export type OrderConfirmationData = {
  id: number;
  name: string;
  email: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
};

export function orderConfirmation(order: OrderConfirmationData) {
  // Kod kommer här
}