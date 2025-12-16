-- Add is_client_accessible to roles (for filtering which roles Tally Users can see/assign)
ALTER TABLE roles ADD COLUMN is_client_accessible BOOLEAN DEFAULT TRUE;

-- parent_id already exists from migration 005

-- Add is_client_accessible to submenus (for filtering which submenus Tally Users can assign)
ALTER TABLE submenus ADD COLUMN is_client_accessible BOOLEAN DEFAULT TRUE;

-- Mark system roles as accessible to clients
UPDATE roles SET is_client_accessible = TRUE WHERE id IN (2, 3);

-- Admin role should NOT be accessible to clients
UPDATE roles SET is_client_accessible = FALSE WHERE id = 1;

-- Mark all current submenus as client accessible (can be adjusted later)
UPDATE submenus SET is_client_accessible = TRUE;
