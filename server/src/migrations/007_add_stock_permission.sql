-- Add product.view_stock permission
INSERT INTO permissions (menu_id, label, action) 
SELECT id, 'View Stock', 'product.view_stock' 
FROM menus WHERE name = 'Products' LIMIT 1
ON DUPLICATE KEY UPDATE label=label;
