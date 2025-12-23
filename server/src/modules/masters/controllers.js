import { pool } from '../../config/db.js';

export async function listPriceLevels(req, res) {
    const userId = req.user.sub;
    const roleId = req.user.role_id;

    // Tally Users see their own. Employees see their parent's. Admin sees all? 
    // For now, assume Tally User context.

    let query = `SELECT * FROM price_levels WHERE user_id = ? OR user_id = (SELECT parent_id FROM users WHERE id = ?) ORDER BY is_standard DESC, name ASC`;
    const [rows] = await pool.query(query, [userId, userId]);

    // Always include a virtual 'Standard' if not present in DB, but DB is better source of truth.
    // If empty (new implementation), return at least Standard.

    if (rows.length === 0) {
        return res.json([{ id: 'standard', name: 'Standard', is_standard: true }]);
    }

    res.json(rows);
}

export async function createPriceLevel(req, res) {
    const { name, syncToTally } = req.body;
    const userId = req.user.sub;

    // Check if exists
    const [exists] = await pool.query('SELECT id FROM price_levels WHERE name = ? AND user_id = ?', [name, userId]);
    if (exists.length > 0) {
        return res.status(400).json({ message: 'Price Level already exists' });
    }

    const [result] = await pool.query('INSERT INTO price_levels (name, user_id, sync_status) VALUES (?, ?, ?)', [name, userId, syncToTally ? 'Pending Sync' : 'Local']);

    // If sync requested, we might assume a bridge process picks it up or we trigger it.
    // For now, just save it.

    res.status(201).json({ message: 'Price Level Created', id: result.insertId });
}

export async function deletePriceLevel(req, res) {
    const { id } = req.params;
    const userId = req.user.sub;

    // Don't delete Standard
    const [level] = await pool.query('SELECT is_standard FROM price_levels WHERE id = ?', [id]);
    if (level.length > 0 && level[0].is_standard) {
        return res.status(400).json({ message: 'Cannot delete Standard Price Level' });
    }

    await pool.query('DELETE FROM price_levels WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Price Level Deleted' });
}
