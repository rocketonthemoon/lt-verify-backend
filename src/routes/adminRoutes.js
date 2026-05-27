const express = require("express");
const {
  adminLogin,
  adminLogout,
  adminMe,
  generateAdminToken,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  listTokens,
  deactivateToken,
  deactivateAllTokens,
  createAdmin,
  listAdmins,
  toggleAdminStatus,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/auth");
const superAdminOnly = require("../middleware/superAdmin");

const router = express.Router();

// Public
router.post("/login", adminLogin);

// Session
router.post("/logout", authMiddleware, adminLogout);
router.get("/me", authMiddleware, adminMe);

// All admins
router.post("/generate-token", authMiddleware, generateAdminToken);
router.get("/tokens", authMiddleware, listTokens);
router.get("/pending-verifications", authMiddleware, getPendingVerifications);
router.post("/approve-verification", authMiddleware, approveVerification);
router.post("/reject-verification", authMiddleware, rejectVerification);

// Super admin only (must be before /:id routes to avoid param conflicts)
router.post("/tokens/deactivate-all", authMiddleware, superAdminOnly, deactivateAllTokens);
router.post("/admins/create", authMiddleware, superAdminOnly, createAdmin);
router.get("/admins", authMiddleware, superAdminOnly, listAdmins);
router.post("/admins/:adminId/toggle-status", authMiddleware, superAdminOnly, toggleAdminStatus);

// Parameterised last
router.post("/tokens/:id/deactivate", authMiddleware, deactivateToken);

module.exports = router;
