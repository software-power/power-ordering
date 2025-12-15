-- Products
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add product', 'product.add' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit product', 'product.edit' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete product', 'product.delete' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE action=VALUES(action);

-- Categories
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add category', 'category.add' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit category', 'category.edit' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete category', 'category.delete' FROM menus WHERE name='Products'
ON DUPLICATE KEY UPDATE action=VALUES(action);

-- Users
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'View users', 'user.view' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add user', 'user.add' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit user', 'user.edit' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete user', 'user.delete' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

-- Roles
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'View roles', 'role.view' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add role', 'role.add' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit role', 'role.edit' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete role', 'role.delete' FROM menus WHERE name='Users'
ON DUPLICATE KEY UPDATE action=VALUES(action);

-- Settings
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'View settings', 'settings.view' FROM menus WHERE name='Settings'
ON DUPLICATE KEY UPDATE action=VALUES(action);

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit settings', 'settings.edit' FROM menus WHERE name='Settings'
ON DUPLICATE KEY UPDATE action=VALUES(action);

-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='Admin'), p.id FROM permissions p
ON DUPLICATE KEY UPDATE permission_id=VALUES(permission_id);
