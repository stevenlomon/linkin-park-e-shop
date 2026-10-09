const FRANKFURTER_BASE_URL = "https://frankfurter.dev/v1"; // Inge sne streck här!

// Detta är vad vi får direkt från Frankfurter
interface FrankFurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Detta är "kontraktet" vi kommer hålla oss till i applikationen; därav export
export interface ExchangeRateResults {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export async function getExchangeRates(base: string = 'SEK', symbols: string[] = ['EUR', 'USD', 'GBP']): Promise<ExchangeRateResults> {
  const symbolsParam = symbols.join(',');
  const url = `${FRANKFURTER_BASE_URL}/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbolsParam)}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 }, // Cache:a datan i en timme!
  });

  if (!response.ok) {
    throw new Error(
      `CurrencyAdapterError: Frankfurter API returned status ${response.status} (${response.statusText})`
    );
  }

  const data: FrankFurterLatestResponse = await response.json();
  
  return {
    base: data.base,
    rates: {
      [data.base]: 1, // Base rate som jämförelse
      ...data.rates,
    },
    date: data.date,
  };
}