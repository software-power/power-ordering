// server/src/migrate/seed.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_DIR = path.join(__dirname, '../seeds');

async function runSeed(file) {
  const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const statements = sql
      .split(/;\s*$/m)
      .filter(s => s.trim().length > 0);
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    await conn.commit();
    console.log(`Seeded: ${file}`);
  } catch (e) {
    await conn.rollback();
    console.error(`Seed failed: ${file}\n`, e.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

async function main() {
  const files = fs.readdirSync(SEEDS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  for (const f of files) {
    await runSeed(f);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
