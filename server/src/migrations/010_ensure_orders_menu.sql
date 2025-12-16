-- Ensure Orders menu exists and is properly configured
-- This migration adds Orders menu if it doesn't exist

-- Check and insert Orders menu if not exists
INSERT IGNORE INTO menus (name, icon, path, status, is_client_accessible)
VALUES ('Orders', 'ShoppingCart', '/orders', 'active', 1);

-- Check and insert Products menu if not exists (for completeness)
INSERT IGNORE INTO menus (name, icon, path, status, is_client_accessible)
VALUES ('Products', 'Package', '/products', 'active', 1);

-- Get menu IDs
SET @orders_menu_id = (SELECT id FROM menus WHERE name = 'Orders' LIMIT 1);
SET @products_menu_id = (SELECT id FROM menus WHERE name = 'Products' LIMIT 1);

-- Ensure permissions exist for Orders
INSERT IGNORE INTO permissions (menu_id, label, action) VALUES
(@orders_menu_id, 'View Orders', 'order.view'),
(@orders_menu_id, 'Add Order', 'order.add'),
(@orders_menu_id, 'Edit Order', 'order.edit'),
(@orders_menu_id, 'Delete Order', 'order.delete'),
(@orders_menu_id, 'Sync to Tally', 'order.sync_to_tally');

-- Ensure permissions exist for Products
INSERT IGNORE INTO permissions (menu_id, label, action) VALUES
(@products_menu_id, 'View Products', 'product.view'),
(@products_menu_id, 'Add Product', 'product.add'),
(@products_menu_id, 'Edit Product', 'product.edit'),
(@products_menu_id, 'Delete Product', 'product.delete'),
(@products_menu_id, 'Sync from Tally', 'product.sync_from_tally'),
(@products_menu_id, 'View Stock', 'product.view_stock');

-- Assign view permissions to all roles for Orders and Products
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r
CROSS JOIN permissions p
WHERE p.menu_id IN (@orders_menu_id, @products_menu_id)
  AND p.action IN ('order.view', 'product.view');

-- Assign all permissions to Admin role (role_id = 1)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE menu_id IN (@orders_menu_id, @products_menu_id);

-- Assign all permissions to Tally User role (role_id = 2)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE menu_id IN (@orders_menu_id, @products_menu_id);

-- Assign non-delete permissions to Employee role (role_id = 3)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE menu_id IN (@orders_menu_id, @products_menu_id)
  AND action NOT LIKE '%.delete';
