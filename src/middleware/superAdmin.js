const superAdminOnly = (req, res, next) => {
  if (req.admin?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' })
  }
  next()
}

module.exports = superAdminOnly
