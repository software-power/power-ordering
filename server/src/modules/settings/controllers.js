
import { pool } from "../../config/db.js";

// Helper to normalize payload keys
function sanitize(payload) {
  const {
    company_name = null,
    logo_url = null,
    favicon_url = null,
    currency = null,
    country = null,
    default_sales_person = null,
    theme_primary_color = null,
  } = payload || {};
  return {
    company_name,
    logo_url,
    favicon_url,
    currency,
    country,
    default_sales_person,
    theme_primary_color,
  };
}

export async function getSettings(req, res) {
  const [rows] = await pool.query(`SELECT * FROM settings WHERE id = 1 LIMIT 1`);
  const data = rows[0] || null;
  res.json(data);
}

export async function saveSettings(req, res) {
  const s = sanitize(req.body);

  // Upsert strategy: try UPDATE first; if affectedRows = 0, INSERT
  const [updateResult] = await pool.query(
    `UPDATE settings
     SET company_name = ?, logo_url = ?, favicon_url = ?, currency = ?, country = ?, default_sales_person = ?, theme_primary_color = ?
     WHERE id = 1`,
    [
      s.company_name,
      s.logo_url,
      s.favicon_url,
      s.currency,
      s.country,
      s.default_sales_person,
      s.theme_primary_color,
    ]
  );

  if (updateResult.affectedRows === 0) {
    await pool.query(
      `INSERT INTO settings (id, company_name, logo_url, favicon_url, currency, country, default_sales_person, theme_primary_color)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.company_name,
        s.logo_url,
        s.favicon_url,
        s.currency,
        s.country,
        s.default_sales_person,
        s.theme_primary_color,
      ]
    );
  }

  res.json({ message: "Settings saved" });
}
