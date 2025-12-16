-- Add sortno column to menus and submenus for proper ordering
-- Update existing menus with proper sort order

-- Add sortno column to menus if not exists
ALTER TABLE menus ADD COLUMN IF NOT EXISTS sortno INT DEFAULT 0;

-- Add sortno column to submenus if not exists  
ALTER TABLE submenus ADD COLUMN IF NOT EXISTS sortno INT DEFAULT 0;

-- Set sortno for menus (Dashboard, Products, Orders, Users, Roles, Settings)
UPDATE menus SET sortno = 1 WHERE name = 'Dashboard';
UPDATE menus SET sortno = 2 WHERE name = 'Products';
UPDATE menus SET sortno = 3 WHERE name = 'Orders';
UPDATE menus SET sortno = 4 WHERE name = 'Users';
UPDATE menus SET sortno = 5 WHERE name = 'Roles';
UPDATE menus SET sortno = 6 WHERE name = 'Settings';

-- Set default sortno for any other menus
UPDATE menus SET sortno = 99 WHERE sortno = 0;
