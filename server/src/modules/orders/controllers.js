import { pool } from '../../config/db.js';

export async function listOrders(req, res) {
    const userId = req.user.sub;
    const isAdmin = req.user.role_id === 1;
    const params = [];

    // Main Order Query
    let query = `
    SELECT o.*, u.fullname as owner_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    `;

    if (!isAdmin) {
        query += `
      WHERE o.user_id = ?
    OR o.user_id = (SELECT parent_id FROM users WHERE id = ?)
`;
        params.push(userId, userId);
    }

    query += ` ORDER BY o.id DESC`;

    const [orders] = await pool.query(query, params);

    // Optional: Fetch items for each order? Or do it on detail view. 
    // To keep list fast, we might just return orders. 
    // But let's fetch items for now to display in frontend easily.

    if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const [items] = await pool.query(`SELECT * FROM order_items WHERE order_id IN (?)`, [orderIds]);

        // Attach items to orders
        orders.forEach(order => {
            order.items = items.filter(i => i.order_id === order.id);
        });
    }

    res.json(orders);
}

export async function createOrder(req, res) {
    const { customer_name, items, payment_mode } = req.body;
    // items: [{ product_id, qty, rate, tax_rate }]
    const userId = req.user.sub;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Calculate totals
        let totalAmount = 0;
        let taxAmount = 0;
        let netAmount = 0;

        items.forEach(item => {
            const amount = item.qty * item.rate;
            // Assuming tax_rate is percentage e.g. 5, 18
            const tax = amount * (item.tax_rate / 100);
            totalAmount += amount; // This is usually taxable value
            taxAmount += tax;
            netAmount += (amount + tax);
        });

        // Generate simple Order Number (e.g., ORD-Timestamp-UserId)
        const orderNumber = `ORD-${Date.now()}-${userId}`;

        const [orderResult] = await connection.query(
            `INSERT INTO orders(user_id, customer_name, order_number, total_amount, tax_amount, net_amount, payment_mode, status) 
             VALUES(?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [userId, customer_name, orderNumber, totalAmount, taxAmount, netAmount, payment_mode || 'Cash']
        );

        const orderId = orderResult.insertId;

        // Insert Items
        const itemValues = items.map(item => [
            orderId, item.product_id, item.qty, item.rate, item.qty * item.rate, item.tax_rate
        ]);

        await connection.query(
            `INSERT INTO order_items(order_id, product_id, qty, rate, amount, tax_rate) VALUES ?`,
            [itemValues]
        );

        await connection.commit();
        res.status(201).json({ message: 'Order created', orderId, orderNumber });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Failed to create order: ' + error.message });
    } finally {
        connection.release();
    }
}

export async function updateOrder(req, res) {
    // Only allow updating status or specific fields for now
    const { status, tally_voucher_number } = req.body;
    const updates = [];
    const values = [];

    if (status) { updates.push('status=?'); values.push(status); }
    if (tally_voucher_number) { updates.push('tally_voucher_number=?'); values.push(tally_voucher_number); }

    if (updates.length === 0) return res.json({ message: 'No changes' });

    values.push(req.params.id);

    await pool.query(
        `UPDATE orders SET ${updates.join(', ')} WHERE id =? `,
        values
    );
    res.json({ message: 'Order updated' });
}

export async function deleteOrder(req, res) {
    await pool.query(`DELETE FROM orders WHERE id =? `, [req.params.id]);
    res.json({ message: 'Order deleted' });
}
