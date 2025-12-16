import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import { pool } from './src/config/db.js';

async function run() {
    try {
        await pool.query("UPDATE menus SET is_client_accessible = TRUE WHERE name IN ('Products', 'Orders', 'Dashboard', 'Users', 'Settings', 'Roles')");
        console.log('Menus updated');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
