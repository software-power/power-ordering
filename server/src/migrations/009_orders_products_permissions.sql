-- Add Orders menu permissions and ensure all Tally-related permissions exist
-- This migration ensures Orders and Products have complete permission sets

-- First, get the menu IDs
SET @products_menu_id = (SELECT id FROM menus WHERE name = 'Products' LIMIT 1);
SET @orders_menu_id = (SELECT id FROM menus WHERE name = 'Orders' LIMIT 1);

-- Add missing permissions for Products (if not exist)
INSERT IGNORE INTO permissions (menu_id, label, action) VALUES
(@products_menu_id, 'View Products', 'product.view'),
(@products_menu_id, 'Add Product', 'product.add'),
(@products_menu_id, 'Edit Product', 'product.edit'),
(@products_menu_id, 'Delete Product', 'product.delete'),
(@products_menu_id, 'Sync from Tally', 'product.sync_from_tally'),
(@products_menu_id, 'View Stock', 'product.view_stock');

-- Add permissions for Orders
INSERT IGNORE INTO permissions (menu_id, label, action) VALUES
(@orders_menu_id, 'View Orders', 'order.view'),
(@orders_menu_id, 'Add Order', 'order.add'),
(@orders_menu_id, 'Edit Order', 'order.edit'),
(@orders_menu_id, 'Delete Order', 'order.delete'),
(@orders_menu_id, 'Sync to Tally', 'order.sync_to_tally'),
(@orders_menu_id, 'View Order Details', 'order.view_details');

-- Assign all Products and Orders permissions to Tally User role (role_id = 2)
-- Get all permission IDs for Products and Orders
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE menu_id IN (@products_menu_id, @orders_menu_id);

-- Assign all Products and Orders permissions to Employee role (role_id = 3) except delete
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE menu_id IN (@products_menu_id, @orders_menu_id) 
  AND action NOT LIKE '%.delete';

-- Ensure Products and Orders menus are client accessible
UPDATE menus SET is_client_accessible = 1 WHERE name IN ('Products', 'Orders');
