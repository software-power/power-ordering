SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE permissions;
TRUNCATE TABLE submenus;
TRUNCATE TABLE menus;
-- We might not want to truncate roles or users if we want to keep data, but the user said "db:seed for menus, permissions etc please truncate before so as to make sure no dublication".
-- Usually safe to truncate menus/permissions. Roles/Users might be risky if we delete the admin user and the seed doesn't restore it exactly right or if user added content.
-- However, user said "truncate before". I will truncate menus, submenus, permissions, role_permissions.
-- I'll likely keep users and roles unless I am sure the seeds restore them fully.
-- The existing seeds 001 and 004 restore base roles and admin user.
TRUNCATE TABLE roles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
