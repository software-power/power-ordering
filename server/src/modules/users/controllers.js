import bcrypt from 'bcrypt';
import { pool } from '../../config/db.js';

export async function listUsers(req, res) {
  // Assuming role_id 1 is Admin
  const isAdmin = req.user.role_id === 1;
  const userId = req.user.sub;

  let query = `
    SELECT u.id, u.fullname, u.username, u.email, u.phone, u.status, u.parent_id, 
           u.is_centraluser, u.tally_url, u.tally_port, u.role_id,
           r.name AS role, r.user_id as role_owner_id,
           p.fullname AS parent_name,
           ro.fullname AS role_owner_name
    FROM users u 
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN users p ON p.id = u.parent_id
    LEFT JOIN users ro ON ro.id = r.user_id
  `;

  const params = [];
  if (!isAdmin) {
    // Tally User/Employee sees themselves AND their employees
    query += ` WHERE u.id = ? OR u.parent_id = ?`;
    params.push(userId, userId);
  }

  query += ` ORDER BY u.parent_id IS NULL DESC, u.parent_id, u.id`;

  const [rows] = await pool.query(query, params);
  res.json(rows);
}

export async function createUser(req, res) {
  const {
    fullname, username, email, phone, password, role_id, department_id, branch_id, status, parent_id,
    is_centraluser, tally_url, tally_port
  } = req.body;

  const hash = await bcrypt.hash(password, 12);

  const creatorId = req.user.sub;
  const creatorRole = req.user.role_id;
  const isAdmin = creatorRole === 1;
  const isTallyUser = creatorRole === 2;

  // Prevent Tally Users from creating other Tally Users (role_id 2)
  if (isTallyUser && parseInt(role_id) === 2) {
    return res.status(403).json({ message: 'Tally Users cannot create other Tally Users. Only Admin can assign Tally User role.' });
  }

  let finalParentId = null;
  let finalIsCentral = 0;
  let finalTallyUrl = null;
  let finalTallyPort = null;
  let finalRoleId = role_id;

  if (isAdmin) {
    // Admin can set everything
    if (is_centraluser) {
      // Central users have Admin as parent (superuser)
      finalParentId = creatorId; // Admin's ID
      finalIsCentral = 1;
    } else {
      finalParentId = parent_id || null;
      finalIsCentral = 0;
    }
    finalTallyUrl = tally_url || null;
    finalTallyPort = tally_port || null;
  } else if (isTallyUser) {
    // Tally User creating Employee
    finalParentId = creatorId; // Force parent to be creator
    finalIsCentral = 0; // Never central
    finalRoleId = role_id; // Allow custom roles (not just 3)

    // Tally config is inherited, so we don't store it on employee
    finalTallyUrl = null;
    finalTallyPort = null;
  } else {
    // Employee creating another employee?
    const [rows] = await pool.query('SELECT parent_id FROM users WHERE id = ?', [creatorId]);
    finalParentId = rows[0]?.parent_id || creatorId;
    finalIsCentral = 0;
    finalRoleId = role_id;
    finalTallyUrl = null;
    finalTallyPort = null;
  }

  try {
    await pool.query(
      `INSERT INTO users (
        fullname, username, email, phone, password_hash, role_id, department_id, branch_id, status, parent_id, creator,
        is_centraluser, tally_url, tally_port
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullname, username, email, phone, hash, finalRoleId, department_id || null, branch_id || null,
        status || 'active', finalParentId, creatorId,
        finalIsCentral, finalTallyUrl, finalTallyPort
      ]
    );
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Failed to create user' });
  }
}

export async function updateUser(req, res) {
  const id = req.params.id;
  const {
    fullname, username, email, phone, role_id, department_id, branch_id, status, parent_id,
    is_centraluser, tally_url, tally_port
  } = req.body;

  const isAdmin = req.user.role_id === 1;
  const currentUserId = req.user.sub;
  const isEditingSelf = parseInt(id) === currentUserId;

  // Prevent users from changing their own role or status (only if being changed)
  if (isEditingSelf && !isAdmin) {
    // Get current user data to ensure role/status doesn't change
    const [currentUser] = await pool.query('SELECT role_id, status FROM users WHERE id = ?', [id]);

    if (currentUser[0]) {
      if (role_id !== undefined && parseInt(role_id) !== currentUser[0].role_id) {
        return res.status(403).json({ message: 'You cannot change your own role. Please contact an administrator.' });
      }
      if (status !== undefined && status !== currentUser[0].status) {
        return res.status(403).json({ message: 'You cannot change your own status. Please contact an administrator.' });
      }
    }
  }

  // Build dynamic update query based on provided fields
  const updates = [];
  const values = [];

  if (fullname !== undefined) { updates.push('fullname=?'); values.push(fullname); }
  if (username !== undefined) { updates.push('username=?'); values.push(username); }
  if (email !== undefined) { updates.push('email=?'); values.push(email); }
  if (phone !== undefined) { updates.push('phone=?'); values.push(phone); }
  if (role_id !== undefined) { updates.push('role_id=?'); values.push(role_id); }
  if (department_id !== undefined) { updates.push('department_id=?'); values.push(department_id || null); }
  if (branch_id !== undefined) { updates.push('branch_id=?'); values.push(branch_id || null); }
  if (status !== undefined) { updates.push('status=?'); values.push(status || 'active'); }
  if (parent_id !== undefined) { updates.push('parent_id=?'); values.push(parent_id || null); }
  if (is_centraluser !== undefined) { updates.push('is_centraluser=?'); values.push(is_centraluser || 0); }
  if (tally_url !== undefined) { updates.push('tally_url=?'); values.push(tally_url || null); }
  if (tally_port !== undefined) { updates.push('tally_port=?'); values.push(tally_port || null); }
  if (req.body.tally_sales_ledger !== undefined) { updates.push('tally_sales_ledger=?'); values.push(req.body.tally_sales_ledger || null); }
  if (req.body.default_price_level !== undefined) { updates.push('default_price_level=?'); values.push(req.body.default_price_level || 'Standard'); }

  updates.push('updator=?');
  values.push(req.user.sub);
  values.push(id);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id=?`;

  try {
    await pool.query(query, values);
    res.json({ message: 'User updated' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Failed to update user' });
  }
}

export async function deleteUser(req, res) {
  const userId = parseInt(req.params.id);
  const currentUserId = req.user.sub;

  // Prevent users from deleting themselves
  if (userId === currentUserId) {
    return res.status(403).json({ message: 'You cannot delete your own account' });
  }

  await pool.query(`DELETE FROM users WHERE id=?`, [userId]);
  res.json({ message: 'User deleted' });
}

export async function getParentUser(req, res) {
  const userId = req.user.sub;

  // Get current user's parent_id
  const [users] = await pool.query('SELECT parent_id FROM users WHERE id = ?', [userId]);
  const parentId = users[0]?.parent_id;

  if (!parentId) {
    return res.json({ fullname: null });
  }

  // Fetch parent user details
  const [parents] = await pool.query('SELECT id, fullname FROM users WHERE id = ?', [parentId]);

  if (parents.length === 0) {
    return res.json({ fullname: null });
  }

  res.json({ fullname: parents[0].fullname });
}

export async function assignRole(req, res) {
  await pool.query(`UPDATE users SET role_id=?, updator=? WHERE id=?`, [req.body.role_id, req.user.sub, req.params.id]);
  res.json({ message: 'Role assigned' });
}
