export function requirePermission(action) {
  return (req, res, next) => {
    // Admin (role_id=1) has all permissions
    if (req.user?.role_id === 1) return next();

    const perms = req.user?.perms || [];
    if (!perms.includes(action)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
