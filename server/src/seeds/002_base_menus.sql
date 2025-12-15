INSERT INTO menus (name, icon, path, status) VALUES
('Dashboard', 'fa fa-home', '/dashboard', 'active'),
('Products', 'fa fa-box', NULL, 'active'),
('Users', 'fa fa-users', NULL, 'active'),
('Settings', 'fa fa-cog', '/settings', 'active')
ON DUPLICATE KEY UPDATE path=VALUES(path), status=VALUES(status);

-- Products submenus
INSERT INTO submenus (menu_id, name, path, status)
SELECT id, 'All products', '/products/list', 'active' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE path=VALUES(path), status=VALUES(status);

INSERT INTO submenus (menu_id, name, path, status)
SELECT id, 'In stock', '/products/stock', 'active' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE path=VALUES(path), status=VALUES(status);

INSERT INTO submenus (menu_id, name, path, status)
SELECT id, 'Categories', '/products/categories', 'active' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE path=VALUES(path), status=VALUES(status);

-- Users submenus
INSERT INTO submenus (menu_id, name, path, status)
SELECT id, 'User list', '/users/list', 'active' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE path=VALUES(path), status=VALUES(status);

INSERT INTO submenus (menu_id, name, path, status)
SELECT id, 'Roles', '/users/roles', 'active' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE path=VALUES(path), status=VALUES(status);
