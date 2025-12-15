import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { pool } from '../../config/db.js';
import { env } from '../../config/env.js';

const signAccess = (id, email, roleId, perms) => jwt.sign({ sub: id, email, role_id: roleId, perms }, env.JWT_SECRET, { expiresIn: '15m' });
const signRefresh = (id) => jwt.sign({ sub: id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

export async function login(req, res) {
  const { username, email, password } = req.body;
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.role_id
     FROM users u WHERE ${email ? 'u.email = ?' : 'u.username = ?'} AND u.status='active' LIMIT 1`,
    [email || username]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const [permRows] = await pool.query(
    `SELECT p.action FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ?`,
    [user.role_id]
  );
  const perms = permRows.map(p => p.action);
  res.json({ accessToken: signAccess(user.id, user.email, user.role_id, perms), refreshToken: signRefresh(user.id) });
}

export async function refreshToken(req, res) {
  const { token } = req.body;
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const userId = payload.sub;
    const [rows] = await pool.query(`SELECT email, role_id FROM users WHERE id=? AND status='active'`, [userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const [permRows] = await pool.query(
      `SELECT p.action FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ?`,
      [user.role_id]
    );
    const perms = permRows.map(p => p.action);
    res.json({ accessToken: signAccess(userId, user.email, user.role_id, perms) });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const [rows] = await pool.query(`SELECT id FROM users WHERE email=? LIMIT 1`, [email]);
  const user = rows[0];
  if (!user) return res.json({ message: 'If the email exists, a link was sent' });
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  await pool.query(`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)`, [token, user.id, expires]);
  const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } });
  const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await transporter.sendMail({ to: email, subject: 'Reset your password', text: `Reset link: ${link}` });
  res.json({ message: 'If the email exists, a link was sent' });
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  const [rows] = await pool.query(`SELECT user_id, expires_at FROM password_reset_tokens WHERE token=? LIMIT 1`, [token]);
  const rec = rows[0];
  if (!rec || new Date(rec.expires_at) < new Date()) return res.status(400).json({ message: 'Invalid or expired token' });
  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query(`UPDATE users SET password_hash=? WHERE id=?`, [hash, rec.user_id]);
  await pool.query(`DELETE FROM password_reset_tokens WHERE token=?`, [token]);
  res.json({ message: 'Password updated' });
}
