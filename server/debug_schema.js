import { pool } from './src/config/db.js';

async function main() {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM users");
        console.log("Users Table Columns:", rows.map(r => r.Field));

        const [orders] = await pool.query("SHOW COLUMNS FROM orders");
        console.log("Orders Table Columns:", orders.map(r => r.Field));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
