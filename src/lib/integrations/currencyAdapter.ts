const FRANKFURTER_BASE_URL = "https://frankfurter.dev/v1/";

interface FrankFurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ExchangeRateResults {
  base: string;
  rates: Record<string, number>;
  date: string;
}