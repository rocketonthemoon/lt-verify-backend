const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.lt_admin_jwt;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("isActive role username");
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: "Account inactive or not found" });
    }

    req.admin = { id: decoded.id, username: admin.username, role: admin.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};

module.exports = authMiddleware;
