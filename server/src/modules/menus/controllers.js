import { pool } from '../../config/db.js';

export async function getMyMenus(req, res) {
  const userPerms = new Set(req.user?.perms || []);
  const isAdmin = req.user.role_id === 1;
  const userRoleId = req.user.role_id;

  const whereClause = isAdmin ? "status='active'" : "status='active' AND is_client_accessible=1";
  const [menus] = await pool.query(`SELECT * FROM menus WHERE ${whereClause} ORDER BY sortno ASC, id ASC`);
  const [allSubs] = await pool.query(`SELECT * FROM submenus WHERE status='active' ORDER BY sortno ASC, id ASC`);
  const [permRows] = await pool.query(`SELECT menu_id, action FROM permissions`);

  // For non-admin users, get their assigned submenus from role_submenus table
  let assignedSubmenuIds = new Set();
  if (!isAdmin) {
    const [roleSubmenus] = await pool.query(
      `SELECT submenu_id FROM role_submenus WHERE role_id = ?`,
      [userRoleId]
    );
    assignedSubmenuIds = new Set(roleSubmenus.map(rs => rs.submenu_id));
  }

  const permsByMenu = new Map();
  for (const p of permRows) {
    const arr = permsByMenu.get(p.menu_id) || [];
    arr.push(p.action);
    permsByMenu.set(p.menu_id, arr);
  }

  function visibleMenu(menu) {
    const menuPerms = permsByMenu.get(menu.id) || [];

    // Check if user has at least one permission for this menu
    const hasPermission = menuPerms.length === 0 || menuPerms.some(a => userPerms.has(a));

    // If user doesn't have any permission for this menu, don't show it (unless admin)
    if (!isAdmin && !hasPermission) {
      return null;
    }

    // Filter submenus: Admin sees all, non-admin only sees assigned submenus
    const children = allSubs.filter(s => {
      if (s.menu_id !== menu.id) return false;

      // Admin sees all submenus
      if (isAdmin) return true;

      // Non-admin only sees submenus assigned to their role
      return assignedSubmenuIds.has(s.id);
    });

    return { id: menu.id, name: menu.name, icon: menu.icon, path: menu.path, children };
  }

  const tree = menus.map(visibleMenu).filter(Boolean);
  res.json(tree);
}
