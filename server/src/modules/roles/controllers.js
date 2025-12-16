import { pool } from '../../config/db.js';

export async function listRoles(req, res) {
  const userId = req.user.sub;
  const isAdmin = req.user.role_id === 1;

  if (isAdmin) {
    const [rows] = await pool.query(`
      SELECT r.*, u.fullname as owner_name 
      FROM roles r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE r.status='active'
      ORDER BY r.id
    `);
    return res.json(rows);
  }

  // Non-admin users: show client-accessible roles (system + own + parent's)
  const [users] = await pool.query('SELECT parent_id FROM users WHERE id=?', [userId]);
  const parentId = users[0]?.parent_id || userId;

  const [rows] = await pool.query(
    `SELECT r.*, u.fullname as owner_name 
     FROM roles r 
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.status='active' 
       AND r.is_client_accessible = TRUE 
       AND (r.user_id IS NULL OR r.user_id = ? OR r.user_id = ?)
     ORDER BY r.id`,
    [userId, parentId]
  );
  res.json(rows);
}

export async function getRoleFormMeta(req, res) {
  const isAdmin = req.user.role_id === 1;
  const userId = req.user.sub;
  const userRoleId = req.user.role_id;

  // Filter menus and submenus based on user role
  const menuWhere = isAdmin ? "status='active'" : "status='active' AND is_client_accessible=1";
  const submenuWhere = isAdmin ? "status='active'" : "status='active' AND is_client_accessible=1";

  let menus, submenus, permissions;

  if (isAdmin) {
    // Admin sees all active menus, submenus, and permissions
    [menus] = await pool.query(`SELECT * FROM menus WHERE ${menuWhere} ORDER BY id`);
    [submenus] = await pool.query(`SELECT * FROM submenus WHERE ${submenuWhere} ORDER BY menu_id, id`);
    [permissions] = await pool.query(`SELECT * FROM permissions ORDER BY menu_id, id`);
  } else {
    // Tally User sees only menus/submenus/permissions assigned to their role
    // Get menus from permissions assigned to user's role
    [menus] = await pool.query(`
      SELECT DISTINCT m.* 
      FROM menus m
      INNER JOIN permissions p ON p.menu_id = m.id
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND m.status='active' AND m.is_client_accessible=1
      ORDER BY m.id
    `, [userRoleId]);

    // Get submenus assigned to user's role
    [submenus] = await pool.query(`
      SELECT DISTINCT s.*
      FROM submenus s
      INNER JOIN role_submenus rs ON rs.submenu_id = s.id
      WHERE rs.role_id = ? AND s.status='active' AND s.is_client_accessible=1
      ORDER BY s.menu_id, s.id
    `, [userRoleId]);

    // Get permissions assigned to user's role
    [permissions] = await pool.query(`
      SELECT DISTINCT p.*
      FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.menu_id, p.id
    `, [userRoleId]);
  }

  res.json({ menus, submenus, permissions });
}

export async function createRole(req, res) {
  const { name, status, permission_ids, submenu_ids, is_client_accessible } = req.body;
  const isAdmin = req.user.role_id === 1;
  const userId = isAdmin ? null : req.user.sub;

  // Non-admin users: force is_client_accessible = TRUE
  const clientAccessible = isAdmin ? (is_client_accessible ? 1 : 0) : 1;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO roles (name, status, user_id, is_client_accessible) VALUES (?, ?, ?, ?)`,
      [name, status || 'active', userId, clientAccessible]
    );
    const roleId = result.insertId;

    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      const values = permission_ids.map(pid => [roleId, pid]);
      await conn.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ?`, [values]);
    }

    if (Array.isArray(submenu_ids) && submenu_ids.length > 0) {
      const values = submenu_ids.map(sid => [roleId, sid]);
      await conn.query(`INSERT INTO role_submenus (role_id, submenu_id) VALUES ?`, [values]);
    }

    await conn.commit();
    res.status(201).json({ message: 'Role created' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to create role' });
  } finally {
    conn.release();
  }
}

export async function updateRole(req, res) {
  const { name, status, permission_ids, submenu_ids, is_client_accessible } = req.body;
  const roleId = req.params.id;
  const isAdmin = req.user.role_id === 1;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update role basic info
    if (isAdmin && is_client_accessible !== undefined) {
      await conn.query(`UPDATE roles SET name=?, status=?, is_client_accessible=? WHERE id=?`,
        [name, status || 'active', is_client_accessible ? 1 : 0, roleId]);
    } else {
      await conn.query(`UPDATE roles SET name=?, status=? WHERE id=?`, [name, status || 'active', roleId]);
    }

    // Update permissions if provided
    if (Array.isArray(permission_ids)) {
      await conn.query(`DELETE FROM role_permissions WHERE role_id=?`, [roleId]);
      if (permission_ids.length > 0) {
        const values = permission_ids.map(pid => [roleId, pid]);
        await conn.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ?`, [values]);
      }
    }

    // Update submenus if provided
    if (Array.isArray(submenu_ids)) {
      await conn.query(`DELETE FROM role_submenus WHERE role_id=?`, [roleId]);
      if (submenu_ids.length > 0) {
        const values = submenu_ids.map(sid => [roleId, sid]);
        await conn.query(`INSERT INTO role_submenus (role_id, submenu_id) VALUES ?`, [values]);
      }
    }

    await conn.commit();
    res.json({ message: 'Role updated' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to update role' });
  } finally {
    conn.release();
  }
}

export async function deleteRole(req, res) {
  const roleId = req.params.id;
  if ([1, 2, 3].includes(Number(roleId))) {
    return res.status(403).json({ message: 'Cannot delete system roles' });
  }

  const isAdmin = req.user.role_id === 1;
  const userId = req.user.sub;

  if (!isAdmin) {
    // Check ownership
    const [rows] = await pool.query('SELECT user_id FROM roles WHERE id=?', [roleId]);
    if (!rows.length || rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Cannot delete roles you did not create' });
    }
  }

  await pool.query(`DELETE FROM roles WHERE id=?`, [roleId]);
  res.json({ message: 'Role deleted' });
}

export async function getRolePermissions(req, res) {
  const roleId = req.params.id;
  const [rows] = await pool.query(
    `SELECT permission_id FROM role_permissions WHERE role_id=?`,
    [roleId]
  );
  const ids = rows.map(r => r.permission_id);
  res.json(ids);
}

export async function getRoleSubmenus(req, res) {
  const roleId = req.params.id;
  const [rows] = await pool.query(
    `SELECT submenu_id FROM role_submenus WHERE role_id=?`,
    [roleId]
  );
  const ids = rows.map(r => r.submenu_id);
  res.json(ids);
}

// setRolePermissions removed as it is now integrated into updateRole, but kept if needed for separate endpoint logic?
// No, user wants it in the modal. We can remove or keep it as legacy. I'll remove it to keep cleaner.
