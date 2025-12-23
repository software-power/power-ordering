import { pool } from './config/db.js';

async function check() {
    console.log("Checking DB State...");
    try {
        const [roles] = await pool.query('SELECT * FROM roles');
        console.log("Roles:", roles);

        const [menus] = await pool.query("SELECT * FROM menus WHERE name = 'Masters'");
        console.log("Masters Menu:", menus);

        const [submenus] = await pool.query("SELECT * FROM submenus WHERE name = 'Price Levels'");
        console.log("Price Levels Submenu:", submenus);

        const [rs] = await pool.query("SELECT * FROM role_submenus WHERE submenu_id IN (SELECT id FROM submenus WHERE name='Price Levels')");
        console.log("Role Submenus:", rs);

    } catch (e) {
        console.error(e);
    }
    process.exit();
}

check();
