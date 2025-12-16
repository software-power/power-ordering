
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

// Internal helper
async function getSettingsInternal() {
  const [rows] = await pool.query(`SELECT * FROM settings WHERE id = 1 LIMIT 1`);
  const data = rows[0] || {};
  // Map snake_case to camelCase if needed, matching what updateSettings expects
  return {
    companyName: data.company_name,
    logoUrl: data.logo_url,
    faviconUrl: data.favicon_url,
    apiBaseUrl: data.api_base_url,
    companyColor: data.company_color,
    timezone: data.timezone,
    currency: data.currency,
    country: data.country,
    defaultSalesPerson: data.default_sales_person
  };
}

export async function getSettings(req, res) {
  const data = await getSettingsInternal();
  // We need to return the raw DB columns or mapped?
  // Previous getSettings returned rows[0] (snake_case). 
  // Settings.tsx expects keys like 'company_name'.
  // So getSettings should probably return raw rows[0].

  const [rows] = await pool.query(`SELECT * FROM settings WHERE id = 1 LIMIT 1`);
  res.json(rows[0] || null);
}

export async function updateSettings(req, res) {
  // STRICT RULE: Only Admin (ID 1) can update global settings
  if (req.user.role_id !== 1) {
    return res.status(403).json({ message: 'Only Admins can change global settings' });
  }

  const { companyName, logoUrl, faviconUrl, apiBaseUrl, companyColor, timezone, currency, country, defaultSalesPerson } = req.body;
  const userId = req.user.sub;
  const current = await getSettingsInternal();

  const query = `
    INSERT INTO settings (id, company_name, logo_url, favicon_url, api_base_url, company_color, timezone, currency, country, default_sales_person, updator, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      company_name = VALUES(company_name),
      logo_url = VALUES(logo_url),
      favicon_url = VALUES(favicon_url),
      api_base_url = VALUES(api_base_url),
      company_color = VALUES(company_color),
      timezone = VALUES(timezone),
      currency = VALUES(currency),
      country = VALUES(country),
      default_sales_person = VALUES(default_sales_person),
      updator = VALUES(updator),
      updated_at = NOW()
  `;

  await pool.query(query, [
    companyName || current.companyName,
    logoUrl || current.logoUrl,
    faviconUrl || current.faviconUrl,
    apiBaseUrl || current.apiBaseUrl,
    companyColor || current.companyColor,
    timezone || current.timezone,
    currency || current.currency,
    country || current.country,
    defaultSalesPerson || current.defaultSalesPerson,
    userId
  ]);

  res.json({ message: 'Settings updated' });
}
