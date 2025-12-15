import bcrypt from 'bcrypt';
import { pool } from '../../config/db.js';

export async function listUsers(req, res) {
  const [rows] = await pool.query(
    `SELECT u.id, u.fullname, u.username, u.email, u.phone, u.status, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id`
  );
  res.json(rows);
}

export async function createUser(req, res) {
  const { fullname, username, email, phone, password, role_id, department_id, branch_id, status } = req.body;
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (fullname, username, email, phone, password_hash, role_id, department_id, branch_id, status, creator)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fullname, username, email, phone, hash, role_id, department_id || null, branch_id || null, status || 'active', req.user.sub]
  );
  res.status(201).json({ message: 'User created' });
}

export async function updateUser(req, res) {
  const id = req.params.id;
  const { fullname, email, phone, role_id, department_id, branch_id, status } = req.body;
  await pool.query(
    `UPDATE users SET fullname=?, email=?, phone=?, role_id=?, department_id=?, branch_id=?, status=?, updator=? WHERE id=?`,
    [fullname, email, phone, role_id, department_id || null, branch_id || null, status || 'active', req.user.sub, id]
  );
  res.json({ message: 'User updated' });
}

export async function deleteUser(req, res) {
  await pool.query(`DELETE FROM users WHERE id=?`, [req.params.id]);
  res.json({ message: 'User deleted' });
}

export async function assignRole(req, res) {
  await pool.query(`UPDATE users SET role_id=?, updator=? WHERE id=?`, [req.body.role_id, req.user.sub, req.params.id]);
  res.json({ message: 'Role assigned' });
}
