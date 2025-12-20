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
    const { name, part_number, stock, price, tally_guid, description, tax_rate, tally_stock_item_name } = req.body;
    const userId = req.user.sub;

    await pool.query(
        `INSERT INTO products(user_id, name, part_number, stock, price, tally_guid, description, tax_rate, tally_stock_item_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, part_number, stock || 0, price || 0, tally_guid || null, description || null, tax_rate || 0, tally_stock_item_name || null]
    );
    res.status(201).json({ message: 'Product created' });
}

export async function updateProduct(req, res) {
    const { name, part_number, stock, price, description, tax_rate, tally_stock_item_name } = req.body;
    await pool.query(
        `UPDATE products SET name =?, part_number =?, stock =?, price =?, description =?, tax_rate =?, tally_stock_item_name =? WHERE id =? `,
        [name, part_number, stock, price, description, tax_rate, tally_stock_item_name, req.params.id]
    );
    res.json({ message: 'Product updated' });
}

export async function deleteProduct(req, res) {
    await pool.query(`DELETE FROM products WHERE id =? `, [req.params.id]);
    res.json({ message: 'Product deleted' });
}
