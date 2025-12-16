import { pool } from '../../config/db.js';

export async function listOrders(req, res) {
    const userId = req.user.sub;
    const isAdmin = req.user.role_id === 1;
    const params = [];

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

    const [rows] = await pool.query(query, params);
    res.json(rows);
}

export async function createOrder(req, res) {
    const { customer_name, amount } = req.body;
    const userId = req.user.sub;

    await pool.query(
        `INSERT INTO orders(user_id, customer_name, amount, status) VALUES(?, ?, ?, 'Pending')`,
        [userId, customer_name, amount]
    );
    res.status(201).json({ message: 'Order created' });
}

export async function updateOrder(req, res) {
    // Usually orders aren't edited after sync, but we allow it for now
    const { customer_name, amount } = req.body;
    await pool.query(
        `UPDATE orders SET customer_name =?, amount =? WHERE id =? `,
        [customer_name, amount, req.params.id]
    );
    res.json({ message: 'Order updated' });
}

export async function deleteOrder(req, res) {
    await pool.query(`DELETE FROM orders WHERE id =? `, [req.params.id]);
    res.json({ message: 'Order deleted' });
}
