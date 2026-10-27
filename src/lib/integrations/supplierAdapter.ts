const SUPPLIER_BASE_URL = "https://leverantor-api.vercel.app/v1/export";

function getApiKey(): string {
  // Om vi inte kan hämta API nyckel från env variables; fail early
  const key = process.env.SUPPLIER_API_KEY;
  if (!key) {
    throw new Error("SUPPLIER_API_KEY is not set in environment variables");
  }
  return key;
}

export async function fetchCSV(): Promise<ArrayBuffer> {
  const url = `${SUPPLIER_BASE_URL}/products.csv?bransch=linkinpark`;

  const response = await fetch(url, {
    headers: { "X-Api-Key": getApiKey() },
  });

  if (!response.ok) {
    throw new Error(`SupplierAdapterError: CSV endpoint returned ${response.status} (${response.statusText})`);
  }

  // Om jag förstår rätt: XML har encoding i header (t.ex. `<?xml version="1.0" encoding="UTF-8"?>`) och JSON har
  // alltid UTF-8 encoding; det är JSON standard. Med csv är det inte så simpelt; det är vårt jobb att se till att
  // datan blir till UTF-8, först genom arrayBuffer() för att få det till raw bytes och sedan decode med TextDecoder()
  return response.arrayBuffer();
}