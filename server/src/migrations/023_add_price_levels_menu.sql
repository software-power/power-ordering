-- 023_add_price_levels_menu.sql
-- Simplified approach: Direct inserts with proper error handling

-- 1. Insert Masters Menu (will skip if exists due to unique constraint)
INSERT IGNORE INTO menus (name, icon, path, sortno, status, is_client_accessible)
VALUES ('Masters', 'Database', '/masters', 30, 'active', 1);

-- 2. Insert Price Levels Submenu (using subquery for menu_id)
INSERT IGNORE INTO submenus (menu_id, name, path, sortno, status, is_client_accessible)
SELECT m.id, 'Price Levels', '/masters/price-levels', 10, 'active', 1
FROM menus m
WHERE m.name = 'Masters';

-- 3. Assign to Role 2 (Tally User)
INSERT IGNORE INTO role_submenus (role_id, submenu_id)
SELECT 2, s.id
FROM submenus s
INNER JOIN menus m ON s.menu_id = m.id
WHERE m.name = 'Masters' AND s.name = 'Price Levels';

-- 4. Assign to Role 3 (Employee)
INSERT IGNORE INTO role_submenus (role_id, submenu_id)
SELECT 3, s.id
FROM submenus s
INNER JOIN menus m ON s.menu_id = m.id
WHERE m.name = 'Masters' AND s.name = 'Price Levels';
