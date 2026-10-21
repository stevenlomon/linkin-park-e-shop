'use client'

import { useRouter } from 'next/navigation'
// import { CURRENCY_COOKIE } from '@/lib/currencies'; Jag lärde mig idag att detta skulle inte funka! CURRENCY_COOKIE importerar
// cookies från 'next/headers' vilket är en server-only module. Client components kan inte importera från server-only modules!

interface CurrencyPickerProps {
  currencies: string[];
  activeCurrency: string;
}

export default function CurrencyPicker({ currencies, activeCurrency }: CurrencyPickerProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const currency = e.target.value;

    // Eftersom att detta endast är en preferens och inte känslig data kan vi sätta cookien direkt
    // här i klienten helt utan API-routes
    // Cookien är giltig i ett år och samesite=lax har med säkerhet och CSRF att göra. Hur många gånger
    // jag än får det förklarat går det inte in och tänker inte tvinga det nu heller. En dag förhoppningsvis haha
    document.cookie = `linkin-park-currency-preference=${currency};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

    // router.refresh() triggar en ny server-render med det nya cookie värdet, precis som CartDropdown gör 
    // efter att en användare tar bort en vara!
    router.refresh();
  }

  return (
    <select
      value={activeCurrency}
      onChange={handleChange}
      aria-label="Välj valuta"
      className="lp-select w-auto py-2 pl-3 pr-8 text-xs"
    >
      {currencies.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}