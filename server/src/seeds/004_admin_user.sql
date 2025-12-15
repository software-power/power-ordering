INSERT INTO users (fullname, username, email, phone, password_hash, role_id, status)
VALUES (
  'System Admin',
  'admin',
  'admin@example.com',
  '000',
  '$2b$12$ypjajVA/pNtNyILV.t3NT.ENfLO1WeThYq/VjXHE6dfjf9jcGsBXK',
  (SELECT id FROM roles WHERE name='Admin'),
  'active'
)
ON DUPLICATE KEY UPDATE email=VALUES(email), role_id=VALUES(role_id), status=VALUES(status);
