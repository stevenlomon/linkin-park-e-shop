import { z } from 'zod';
// Medvetet ingen Resend SDK import; vi kör raw fetch!

const API_KEY = process.env.RESEND_API_KEY ?? '';
const FROM = process.env.EMAIL_FROM ?? 'Linkin Park Shop <onboarding@resend.dev>';
const RESEND_URL = 'https://api.resend.com/emails';

if (!API_KEY) {
  console.warn('RESEND_API_KEY saknas i .env. e-postfunktioner inaktiverade');
}

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const ResendResponseSchema = z.object({
  id: z.string(),
});

const ResendErrorSchema = z.object({
  message: z.string(),
});

export async function sendEmail(email: Email, idempotencyKey?: string,): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // Vår idempotency key är optional. Adaptern hålls generisk och skickar bara emails; idempotency key logiken kommer leva någon annan stans
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  // En simpel POST fetch! Med email innehållet + from som body 
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ from: FROM, ...email }),
    signal: AbortSignal.timeout(5_000),
  });

  const json = await response.json();

  if (!response.ok) {
    const error = ResendErrorSchema.safeParse(json);
    const message = error.success ? error.data.message : `HTTP ${response.status}`;
    throw new Error(`Resend svarade ${response.status}: ${message}`);
  }
  
  const parsed = ResendResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(`Oväntat svar från Resend: ${parsed.error.message}`);
  }

  return parsed.data.id;
}