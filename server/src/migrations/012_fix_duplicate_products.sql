-- Fix duplicate Products menu and set proper order
-- This script removes duplicates and ensures correct menu order

-- First, find and keep only one Products menu (the one with lowest ID)
SET @products_keep_id = (SELECT MIN(id) FROM menus WHERE name = 'Products');

-- Delete duplicate Products menus
DELETE FROM menus WHERE name = 'Products' AND id != @products_keep_id;

-- Update menu IDs for reference
SET @products_id = (SELECT id FROM menus WHERE name = 'Products' LIMIT 1);
SET @orders_id = (SELECT id FROM menus WHERE name = 'Orders' LIMIT 1);
SET @users_id = (SELECT id FROM menus WHERE name = 'Users' LIMIT 1);
SET @settings_id = (SELECT id FROM menus WHERE name = 'Settings' LIMIT 1);
SET @dashboard_id = (SELECT id FROM menus WHERE name = 'Dashboard' LIMIT 1);
SET @roles_id = (SELECT id FROM menus WHERE name = 'Roles' LIMIT 1);

-- Add display_order column if it doesn't exist
ALTER TABLE menus ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- Set proper display order: Dashboard, Products, Orders, Users, Roles, Settings
UPDATE menus SET display_order = 1 WHERE id = @dashboard_id;
UPDATE menus SET display_order = 2 WHERE id = @products_id;
UPDATE menus SET display_order = 3 WHERE id = @orders_id;
UPDATE menus SET display_order = 4 WHERE id = @users_id;
UPDATE menus SET display_order = 5 WHERE id = @roles_id;
UPDATE menus SET display_order = 6 WHERE id = @settings_id;

-- Ensure both Products and Orders are client accessible
UPDATE menus SET is_client_accessible = 1 WHERE name IN ('Products', 'Orders');
