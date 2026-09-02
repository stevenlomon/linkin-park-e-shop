// Litet AI-written dev-script för att verifiera db-anslutningen utan att starta Next.
// Körs med:  pnpm db:test
import { pool } from '../src/lib/db.ts';

const url = process.env.DATABASE_URL;
console.log('DATABASE_URL:', url ? url.replace(/:[^:@]*@/, ':***@') : '(undefined)');

try {
  const meta = await pool.query(
    'select current_database() as db, current_user as usr, version() as ver'
  );
  console.log('\n✅ Ansluten');
  console.log('   db   :', meta.rows[0].db);
  console.log('   user :', meta.rows[0].usr);
  console.log('   ver  :', String(meta.rows[0].ver).split(',')[0]);

  const tables = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
  );
  console.log('\n   Tabeller i public:', tables.rowCount === 0 ? '(inga)' : '');
  for (const r of tables.rows) console.log('     -', r.table_name);
} catch (err) {
  console.error('\n❌ Anslutning misslyckades');
  console.error('   ', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
