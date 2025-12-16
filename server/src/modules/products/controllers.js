import { pool } from '../../config/db.js';

export async function listProducts(req, res) {
    const userId = req.user.sub;
    const isAdmin = req.user.role_id === 1;

    let query = `
    SELECT p.*, u.fullname as owner_name
    FROM products p
    JOIN users u ON u.id = p.user_id
    `;
    const params = [];

    if (!isAdmin) {
        // Basic logic: User sees products they created OR their parent created
        // We need to fetch the user's parent_id to do this correctly, OR join.
        // Simplifying: If user has a parent, show parent's products. If user is parent (Main User), show own.

        // We'll join users to check relationship
        // This is complex. Let's simplify:
        // 1. Get current user's details (parent_id)
        // 2. Query products for (my_id) OR (my_parent_id)
        // We can assume the user info is available or do a subquery.

        query += `
      WHERE p.user_id = ?
    OR p.user_id = (SELECT parent_id FROM users WHERE id = ?)
`;
        params.push(userId, userId);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
}

export async function createProduct(req, res) {
    const { name, part_number, stock, price, tally_guid } = req.body;
    const userId = req.user.sub;

    await pool.query(
        `INSERT INTO products(user_id, name, part_number, stock, price, tally_guid) VALUES(?, ?, ?, ?, ?, ?)`,
        [userId, name, part_number, stock || 0, price || 0, tally_guid || null]
    );
    res.status(201).json({ message: 'Product created' });
}

export async function updateProduct(req, res) {
    const { name, part_number, stock, price } = req.body;
    await pool.query(
        `UPDATE products SET name =?, part_number =?, stock =?, price =? WHERE id =? `,
        [name, part_number, stock, price, req.params.id]
    );
    res.json({ message: 'Product updated' });
}

export async function deleteProduct(req, res) {
    await pool.query(`DELETE FROM products WHERE id =? `, [req.params.id]);
    res.json({ message: 'Product deleted' });
}
