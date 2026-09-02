import { Pool } from 'pg';

// Samma pattern som används i Florilegium. Ska inte gå in på super detalj men vi cache:ar 
// vår pg pool i `global` objektet så att den överlever Next.js reloads
const globalForPg = global as unknown as { pgPool: Pool }; 

export const pool = 
globalForPg.pgPool || new Pool({ // Kolla `global` objektet i första hand. Skapa en ny pool endast som fallback!
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // För att inte få `no encryption` error
  },
});

// Vår "global escape hatch". Används *endast* i development för att överleva Hot Module Replacement. Aldrig i produktion
if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}