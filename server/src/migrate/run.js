// server/src/migrate/run.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getApplied() {
  const [rows] = await pool.query(`SELECT name FROM migrations ORDER BY id`);
  return new Set(rows.map(r => r.name));
}

async function runMigration(file) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Allow multiple statements separated by ; — split carefully
    const statements = sql
      .split(/;\s*$/m) // split by semicolon at end of lines
      .filter(s => s.trim().length > 0);
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    await conn.query(`INSERT INTO migrations (name) VALUES (?)`, [file]);
    await conn.commit();
    console.log(`Applied: ${file}`);
  } catch (e) {
    await conn.rollback();
    console.error(`Failed: ${file}\n`, e.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

async function main() {
  await ensureMigrationsTable();
  const applied = await getApplied();
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort(); // lexicographic order

  for (const f of files) {
    if (!applied.has(f)) {
      await runMigration(f);
    } else {
      console.log(`Skipped (already applied): ${f}`);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
