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

export async function buildAuthURL(state: string): Promise<{url: string, codeVerifier: string}> {
  const { clientId, redirectUri } = getConfig();

  // Dessa två kommer skapas och få sina egna helper functions i nästkommande commits
  // const codeVerifier = generateCodeVerifier(); 
  // const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    // Kommer ha client_id, redirect_uri, scope etc etc.
  });

  return {
    url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    codeVerifier: "Ska skapas",
  };
}