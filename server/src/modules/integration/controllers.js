import { pool } from '../../config/db.js';

export async function getPendingOrders(req, res) {
    // Return orders that need to be posted to Tally
    // Limit to 50 to avoid overwhelming
    try {
        const [orders] = await pool.query(`
            SELECT o.*, u.tally_ledger_name, u.tally_sales_ledger, u.fullname as customer_name
            FROM orders o
            JOIN users u ON u.id = o.user_id
            WHERE o.status = 'Pending'
            ORDER BY o.order_date ASC
            LIMIT 50
        `);

        // Fetch items for these orders
        if (orders.length > 0) {
            const orderIds = orders.map(order => order.id);
            const [items] = await pool.query(
                `SELECT oi.*, p.name as product_name, p.tally_stock_item_name 
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id IN (?)`,
                [orderIds]
            );

            orders.forEach(order => {
                order.items = items.filter(item => item.order_id === order.id);
            });
        }

        res.json(orders);
    } catch (error) {
        console.error("Error fetching pending orders:", error);
        res.status(500).json({ message: "Failed to fetch pending orders" });
    }
}

export async function updateOrderStatus(req, res) {
    const { order_id, status, tally_voucher_number, tally_voucher_date } = req.body;

    if (!order_id || !status) {
        return res.status(400).json({ message: "Missing order_id or status" });
    }

    try {
        await pool.query(
            `UPDATE orders 
             SET status = ?, tally_voucher_number = ?, tally_voucher_date = ? 
             WHERE id = ?`,
            [status, tally_voucher_number || null, tally_voucher_date || null, order_id]
        );
        res.json({ message: "Order status updated" });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Failed to update order status" });
    }
}

export async function syncProductsFromTally(req, res) {
    const { products } = req.body; // Expecting array of { name, stock, price, tally_guid, prices: [{level, price}] }
    const userId = req.user.sub;

    if (!products || !Array.isArray(products)) {
        return res.status(400).json({ message: "Invalid products data" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const product of products) {
            let productId;
            const [existing] = await connection.query(
                `SELECT id FROM products WHERE name = ? AND user_id = ?`,
                [product.name, userId]
            );

            if (existing.length > 0) {
                // Update
                productId = existing[0].id;
                await connection.query(
                    `UPDATE products SET stock = ?, price = ?, tally_guid = ?, tally_stock_item_name = ? WHERE id = ?`,
                    [product.stock, product.price, product.guid, product.name, productId]
                );
            } else {
                // Insert
                const [result] = await connection.query(
                    `INSERT INTO products (user_id, name, stock, price, tally_guid, tally_stock_item_name) VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, product.name, product.stock, product.price, product.guid, product.name]
                );
                productId = result.insertId;
            }

            // Sync Prices
            if (product.prices && Array.isArray(product.prices)) {
                for (const p of product.prices) {
                    // Upsert price
                    // We can use ON DUPLICATE KEY UPDATE but need valid syntax
                    await connection.query(
                        `INSERT INTO product_prices (product_id, price_level, price) 
                         VALUES (?, ?, ?) 
                         ON DUPLICATE KEY UPDATE price = VALUES(price)`,
                        [productId, p.level, p.price]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ message: `Synced ${products.length} products` });
    } catch (error) {
        await connection.rollback();
        console.error("Error syncing products:", error);
        res.status(500).json({ message: "Failed to sync products" });
    } finally {
        connection.release();
    }
}

export async function getPendingPriceLevels(req, res) {
    const userId = req.user.sub;
    try {
        const [rows] = await pool.query(`SELECT * FROM price_levels WHERE user_id = ? AND sync_status = 'Pending Sync'`, [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pending price levels' });
    }
}

export async function updatePriceLevelStatus(req, res) {
    const { id, status } = req.body;
    try {
        await pool.query('UPDATE price_levels SET sync_status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
    }
}
