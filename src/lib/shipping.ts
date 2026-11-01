// Egen prislista — PostNord har inget pris-API för Sverige.
// Priserna sätts av shoppen, precis som i lecture-slidesen.

export type ShippingMethod = 'ombud' | 'home';

const PRICES: Record<ShippingMethod, number> = {
  ombud: 59,
  home: 99,
};

const FREE_SHIPPING_THRESHOLD = 500;

export function getShippingPrice(method: ShippingMethod, cartTotal: number): number {
  if (cartTotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return PRICES[method];
}

export function getShippingLabel(method: ShippingMethod): string {
  return method === 'ombud' ? 'Ombud (PostNord)' : 'Hemleverans';
}
