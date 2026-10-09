const FRANKFURTER_BASE_URL = "https://frankfurter.dev/v1/";

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
  return {
    base: "base",
    rates: {"rates": 1},
    date: "date"
  }
}