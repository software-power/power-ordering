import { pool } from '../config/db.js';

async function seedProducts() {
    try {
        console.log("Seeding demo products...");

        // Check if user 1 exists (assumed admin)
        const [users] = await pool.query("SELECT id FROM users WHERE id = 1");
        if (users.length === 0) {
            console.error("User ID 1 not found. Cannot seed.");
            process.exit(1);
        }

        const products = [
            { name: "Dell Latitude 5420", stock: 10, price: 1500000 },
            { name: "HP ProBook 450 G8", stock: 5, price: 1450000 },
            { name: "Logitech Wireless Mouse", stock: 50, price: 25000 },
            { name: "USB-C Hub Multiport", stock: 20, price: 45000 }
        ];

        for (const p of products) {
            // Check if exists
            const [existing] = await pool.query("SELECT id FROM products WHERE name = ?", [p.name]);
            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO products (user_id, name, stock, price, status, tally_stock_item_name) 
                     VALUES (1, ?, ?, ?, 'active', ?)`,
                    [p.name, p.stock, p.price, p.name]
                );
                console.log(`Added: ${p.name}`);
            } else {
                console.log(`Skipped (Exists): ${p.name}`);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seedProducts();
