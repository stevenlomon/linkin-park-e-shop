// 'use client' Denna komponent är inte en Client component after all!

import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getCart, getCartItemCount } from '@/lib/cart'
import { getExchangeRates } from '@/lib/integrations/currencyAdapter';
import { getSelectedCurrency } from '@/lib/currencies';
import CartDropdown from './navbar/CartDropdown';
import AccountDropdown from './navbar/AccountDropdown';
import CurrencyPicker from './navbar/CurrencyPicker';

// Butikens egen nav är versal och spärrad. Vi speglar strukturen med våra egna sidor
const NAV_LINKS = [
  { href: '/products', label: 'Produkter' },
  { href: '/search', label: 'Sök' }, // Istället för en dedikerad sökbar på sidan for now. För enkelhetens skull
];

export default async function Navbar() {
  const user = await getCurrentUser();

  // Vi skaffar värdet på antalet items i kundkorgen på precis samma sätt som user!
  const cartItemCount = await getCartItemCount();
  const cartItems = await getCart();

  // Nu kan vi även använda vår adapter för att få rates, åter igen direkt i denna server component!
  const rates = await getExchangeRates();
  const selectedCurrency = await getSelectedCurrency();

  return (
    <header className="border-b border-line bg-surface">
      <div className="lp-container-wide flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-14">
          <Link href="/" className="text-2xl font-bold uppercase tracking-tight hover:text-accent">
            Linkin Park
          </Link>

          <nav className="flex flex-wrap items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="lp-nav-link">
                {link.label}
              </Link>
            ))}

            {/* Admin-länkar syns bara för admin */}
            {user?.role_name === 'admin' && (
              <>
                <Link href="/products/add" className="lp-nav-link text-accent">
                  Lägg till produkt
                </Link>
                <Link href="/admin" className="lp-nav-link text-accent">
                  Admin Dashboard
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-8 lg:shrink-0">
          {/* Vår currencies prop vill ha en array med strings. `rates.rates` är ett objekt. `Object.keys` 
              tar endast nycklarna från objektet */}
          <CurrencyPicker currencies={Object.keys(rates.rates)} activeCurrency={selectedCurrency} />

          <CartDropdown items={cartItems} itemCount={cartItemCount} rates={rates.rates} selectedCurrency={selectedCurrency} />

          <AccountDropdown user={user} />
        </div>

      </div>
    </header>
  )
};
