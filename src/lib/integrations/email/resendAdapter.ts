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

export async function sendEmail(email: Email, idempotencyKey?: string,): Promise<string> {
  return "Kommer strax"
}