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

const TokenResponseSchema = z.object({
  id_token: z.string(),
  access_token: z.string(),
  token_type: z.string(),
});

const IdTokenPayloadSchema = z.object({
  iss: z.enum(['accounts.google.com', 'https://accounts.google.com']), // Vi ser till 100% att Google issued the token payload
  aud: z.string(), // Måste matcha vår Client ID
  exp: z.number(), // Får inte vara expired

  // Detta är användarinfon vi får ut från Google's JWT!
  sub: z.string(), // Detta är en Google användares unika ID. Inte email som kan ändras!
  email: z.email(),
  email_verified: z.boolean().optional(),
  name: z.string().optional(),
  given_name: z.string().optional(),
});

export type GoogleUser = z.infer<typeof IdTokenPayloadSchema>;

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
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code', // Annars finns tydligen bl.a. `token` vilket är mindre secure eftersom token:et blir exposed i browsern
    scope: 'openid email profile', // Principle of least privilege!
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'online', // Google erbjuder även 'offline' för vissa use cases
    prompt: 'select_account',
  });

  return {
    url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    codeVerifier,
  };
}

// Efter att användaren redirectats till auth URL:en via funktionen ovan och loggat in blir de redirected till vår callback
// med en `code` och `state`. `code` byts här i denna funktion ut mot en id_token (JWT med användarinfo)
export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<{ idToken: string }> {
  const { clientId, clientSecret, redirectUri } = getConfig();

  // Server-to-server POST request som innehåller `code`. Från denna response får vi id_token
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
    signal: AbortSignal.timeout(5_000), // Timeout efter 5 sekunder
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${text}`);
  }

  const data = TokenResponseSchema.parse(await res.json());
  return { idToken: data.id_token };
}

// Slutligen har vi denna sista funktion för att avkoda den JWT vi får i ovanstående funktion
export function decodeAndValidateIdToken(idToken: string): GoogleUser {
  const { clientId } = getConfig();

  // Googles id_token är en JWT med tre base64url-delar: header.payload.signature
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts');
  }

  // Avkoda JWT:n och validera data formen efter vårt Zod schema
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  const parsed = IdTokenPayloadSchema.parse(payload);

  // En andra runda av validering. Inte av formen, utan av innehållet
  if (parsed.aud !== clientId) {
    throw new Error(`Invalid aud: expected ${clientId}, got ${parsed.aud}`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) {
    throw new Error('ID token has expired');
  }
  
  // Parsed och validated!
  return parsed;
}