-- START NEW INSTALLATION V1.0.0
CREATE DATABASE IF NOT EXISTS online_ordering CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_ordering;

-- menus
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100),
  path VARCHAR(255),
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- submenus
CREATE TABLE IF NOT EXISTS submenus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_submenus_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

-- permissions
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  label VARCHAR(150) NOT NULL,
  action VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_permissions_action (action),
  CONSTRAINT fk_permissions_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

-- roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  department_id INT,
  branch_id INT,
  status ENUM('active','inactive') DEFAULT 'active',
  creator INT,
  updator INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  UNIQUE KEY uq_role_perm (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token VARCHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



INSERT INTO roles (name, status) VALUES
('Admin', 'active'), ('Manager', 'active'), ('Staff', 'active')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO menus (name, icon, path, status) VALUES
('Dashboard', 'fa fa-home', '/dashboard', 'active'),
('Products', 'fa fa-box', NULL, 'active'),
('Users', 'fa fa-users', NULL, 'active'),
('Settings', 'fa fa-cog', '/settings', 'active')
ON DUPLICATE KEY UPDATE path=VALUES(path), status=VALUES(status);

INSERT INTO submenus (menu_id, name, path, status)
SELECT m.id, 'All products', '/products/list', 'active' FROM menus m WHERE m.name='Products';
INSERT INTO submenus (menu_id, name, path, status)
SELECT m.id, 'In stock', '/products/stock', 'active' FROM menus m WHERE m.name='Products';
INSERT INTO submenus (menu_id, name, path, status)
SELECT m.id, 'Categories', '/products/categories', 'active' FROM menus m WHERE m.name='Products';

INSERT INTO submenus (menu_id, name, path, status)
SELECT m.id, 'User list', '/users/list', 'active' FROM menus m WHERE m.name='Users';
INSERT INTO submenus (menu_id, name, path, status)
SELECT m.id, 'Roles', '/users/roles', 'active' FROM menus m WHERE m.name='Users';

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add product', 'product.add' FROM menus WHERE name='Products';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit product', 'product.edit' FROM menus WHERE name='Products';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete product', 'product.delete' FROM menus WHERE name='Products';

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add category', 'category.add' FROM menus WHERE name='Products';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit category', 'category.edit' FROM menus WHERE name='Products';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete category', 'category.delete' FROM menus WHERE name='Products';

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add user', 'user.add' FROM menus WHERE name='Users';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit user', 'user.edit' FROM menus WHERE name='Users';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete user', 'user.delete' FROM menus WHERE name='Users';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'View users', 'user.view' FROM menus WHERE name='Users';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Add role', 'role.add' FROM menus WHERE name='Users';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit role', 'role.edit' FROM menus WHERE name='Users';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Delete role', 'role.delete' FROM menus WHERE name='Users';
INSERT INTO permissions (menu_id, label, action)
SELECT id, 'View roles', 'role.view' FROM menus WHERE name='Users';

INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='Admin'), p.id FROM permissions p
ON DUPLICATE KEY UPDATE permission_id=VALUES(permission_id);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  company_name VARCHAR(255),
  logo_url TEXT,
  favicon_url TEXT,
  currency VARCHAR(10),
  country VARCHAR(100),
  default_sales_person VARCHAR(255),
  theme_primary_color VARCHAR(20),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO settings (id, company_name, currency, country, default_sales_person, theme_primary_color)
VALUES (1, NULL, NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO menus (id, name, icon, path, status)
VALUES (NULL, 'Settings', 'fa fa-cog', '/settings', 'active')
ON DUPLICATE KEY UPDATE path='/settings', status='active';

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'View settings', 'settings.view' FROM menus WHERE name='Settings'
ON DUPLICATE KEY UPDATE action = action;

INSERT INTO permissions (menu_id, label, action)
SELECT id, 'Edit settings', 'settings.edit' FROM menus WHERE name='Settings'
ON DUPLICATE KEY UPDATE action = action;

INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='Admin'), p.id
FROM permissions p
WHERE p.action IN ('settings.view', 'settings.edit')
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);


