const AdminActivityLog = require("../models/AdminActivityLog");

const logActivity = async (req, action, description, details = {}, status = "success", errorMessage = null) => {
  try {
    const adminId = req.admin?.id;
    const adminUsername = req.admin?.username || "unknown";
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.get("user-agent") || null;

    const log = new AdminActivityLog({
      adminId,
      adminUsername,
      action,
      description,
      details,
      ipAddress,
      userAgent,
      status,
      errorMessage,
    });

    await log.save();
  } catch (error) {
    console.error("Failed to log admin activity:", error.message);
  }
};

module.exports = logActivity;
