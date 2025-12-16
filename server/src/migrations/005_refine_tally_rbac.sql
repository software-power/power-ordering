-- Add is_client_accessible to menus
ALTER TABLE menus ADD COLUMN is_client_accessible BOOLEAN DEFAULT FALSE;

-- Allow roles to be owned by users (for tenant specific roles)
ALTER TABLE roles ADD COLUMN user_id INT NULL, 
ADD CONSTRAINT fk_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Insert default Tally User and Employee roles if they don't exist
INSERT INTO roles (id, name, status) VALUES (2, 'Tally User', 'active') ON DUPLICATE KEY UPDATE name='Tally User';
INSERT INTO roles (id, name, status) VALUES (3, 'Employee', 'active') ON DUPLICATE KEY UPDATE name='Employee';

-- Make Products and Orders menus accessible to clients
UPDATE menus SET is_client_accessible = TRUE WHERE name IN ('Products', 'Orders', 'Dashboard', 'Users', 'Settings', 'Roles');

-- Also, submenus? Submenus don't have is_client_accessible, we filter by menu.
