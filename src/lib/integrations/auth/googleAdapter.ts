import { z } from 'zod';
import crypto from 'node:crypto';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Samma pattern som i våra andra adapters så att det kan köras utan krångligheter i produktion
function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET or GOOGLE_REDIRECT_URI');
  }

  return { clientId, clientSecret, redirectUri };
}

// Våra två helper functions för `code_verifier` och `code_challenge`. 
// Dessa två faller båda under PKCE: Proof Key for Code Exchange
// code_verifier är tydligen en random sträng på 43-128 tecken enligt RFC 7636
// code_challenge är SHA-256 hashen av denna sträng, base64url-kodad
// Full authentication kan inte ske utan att ha både code_verifier och code_challenge
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

export async function buildAuthURL(state: string): Promise<{url: string, codeVerifier: string}> {
  const { clientId, redirectUri } = getConfig();

  // Använd våra två PKCE helpers
  const codeVerifier = generateCodeVerifier(); 
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    // Kommer ha client_id, redirect_uri, scope etc etc.
  });

  return {
    url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    codeVerifier: "Ska skapas",
  };
}