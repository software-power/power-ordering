import { pool } from '../../config/db.js';

export async function listRoles(req, res) {
  const [rows] = await pool.query(`SELECT * FROM roles`);
  res.json(rows);
}

export async function createRole(req, res) {
  const { name, status } = req.body;
  await pool.query(`INSERT INTO roles (name, status) VALUES (?, ?)`, [name, status || 'active']);
  res.status(201).json({ message: 'Role created' });
}

export async function updateRole(req, res) {
  const { name, status } = req.body;
  await pool.query(`UPDATE roles SET name=?, status=? WHERE id=?`, [name, status || 'active', req.params.id]);
  res.json({ message: 'Role updated' });
}

export async function deleteRole(req, res) {
  await pool.query(`DELETE FROM roles WHERE id=?`, [req.params.id]);
  res.json({ message: 'Role deleted' });
}

export async function getRolePermissions(req, res) {
  const roleId = req.params.id;
  const [permissions] = await pool.query(`
    SELECT p.id, p.menu_id, p.label, p.action
    FROM permissions p
    ORDER BY p.menu_id, p.id
  `);
  const [assignedRows] = await pool.query(`
    SELECT permission_id FROM role_permissions WHERE role_id = ?
  `, [roleId]);
  const assigned = new Set(assignedRows.map(r => r.permission_id));
  res.json({ permissions, assigned: Array.from(assigned) });
}

export async function setRolePermissions(req, res) {
  const roleId = req.params.id;
  const { permission_ids } = req.body; // array
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM role_permissions WHERE role_id=?`, [roleId]);
    if (Array.isArray(permission_ids) && permission_ids.length) {
      const values = permission_ids.map(pid => [roleId, pid]);
      await conn.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ?`, [values]);
    }
    await conn.commit();
    res.json({ message: 'Permissions updated' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to update permissions' });
  } finally {
    conn.release();
  }
}
