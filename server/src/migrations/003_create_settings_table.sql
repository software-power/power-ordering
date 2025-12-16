CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_name VARCHAR(255) DEFAULT 'PowerApp',
  logo_url TEXT,
  favicon_url TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  country VARCHAR(100) DEFAULT 'USA',
  default_sales_person VARCHAR(255),
  theme_primary_color VARCHAR(50) DEFAULT '#4f46e5',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (id, company_name, currency, country, theme_primary_color)
VALUES (1, 'PowerApp', 'USD', 'USA', '#4f46e5');
