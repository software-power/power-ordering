import { pool } from '../../config/db.js';

export async function getMyMenus(req, res) {
  const userPerms = new Set(req.user?.perms || []);
  const [menus] = await pool.query(`SELECT * FROM menus WHERE status='active' ORDER BY id`);
  const [subs] = await pool.query(`SELECT * FROM submenus WHERE status='active' ORDER BY id`);
  const [permRows] = await pool.query(`SELECT menu_id, action FROM permissions`);

  const permsByMenu = new Map();
  for (const p of permRows) {
    const arr = permsByMenu.get(p.menu_id) || [];
    arr.push(p.action);
    permsByMenu.set(p.menu_id, arr);
  }

  function visibleMenu(menu) {
    const menuPerms = permsByMenu.get(menu.id) || [];
    const hasOwn = menuPerms.length === 0 || menuPerms.some(a => userPerms.has(a));
    const children = subs.filter(s => s.menu_id === menu.id);
    const visibleChildren = children.filter(sm => {
      const smPerms = permsByMenu.get(menu.id) || []; // using parent menu perms
      return smPerms.length === 0 || smPerms.some(a => userPerms.has(a));
    });
    const isVisible = hasOwn || visibleChildren.length > 0 || !!menu.path;
    return isVisible ? { id: menu.id, name: menu.name, icon: menu.icon, path: menu.path, children: visibleChildren } : null;
  }

  const tree = menus.map(visibleMenu).filter(Boolean);
  res.json(tree);
}
