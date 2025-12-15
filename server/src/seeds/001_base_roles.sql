INSERT INTO roles (name, status) VALUES
('Admin', 'active'),
('Manager', 'active'),
('Staff', 'active')
ON DUPLICATE KEY UPDATE status=VALUES(status);
