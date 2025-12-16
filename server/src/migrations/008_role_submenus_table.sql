CREATE TABLE IF NOT EXISTS role_submenus (
  role_id INT NOT NULL,
  submenu_id INT NOT NULL,
  PRIMARY KEY (role_id, submenu_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (submenu_id) REFERENCES submenus(id) ON DELETE CASCADE
);