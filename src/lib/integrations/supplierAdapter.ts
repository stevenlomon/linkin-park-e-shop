const SUPPLIER_BASE_URL = "https://leverantor-api.vercel.app/v1/export";

function getApiKey(): string {
  // Om vi inte kan hämta API nyckel från env variables; fail early
  const key = process.env.SUPPLIER_API_KEY;
  if (!key) {
    throw new Error("SUPPLIER_API_KEY is not set in environment variables");
  }
  return key;
}