const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/Admin");
const AdminToken = require("../models/AdminToken");
const PhoneNumber = require("../models/PhoneNumber");
const VerificationRequest = require("../models/VerificationRequest");

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const admin = await Admin.findOne({ username }).select("+password");

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    admin.lastLogin = new Date();
    await admin.save();

    res.cookie("lt_admin_jwt", token, COOKIE_OPTS);
    res.status(200).json({
      message: "Login successful",
      admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout — clear the cookie
const adminLogout = (req, res) => {
  res.clearCookie("lt_admin_jwt", { ...COOKIE_OPTS, maxAge: 0 });
  res.status(200).json({ message: "Logged out" });
};

// Return current admin info from the JWT
const adminMe = (req, res) => {
  res.status(200).json({
    admin: { id: req.admin.id, username: req.admin.username, role: req.admin.role },
  });
};

// Generate admin tokens for rating
const generateAdminToken = async (req, res) => {
  try {
    const { quantity = 1, purpose = "rating" } = req.body;

    const qty = parseInt(quantity, 10)
    if (!qty || qty < 1 || qty > 5) {
      return res
        .status(400)
        .json({ error: "Quantity must be between 1 and 5" });
    }

    const tokens = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    for (let i = 0; i < qty; i++) {
      const token = crypto.randomBytes(32).toString("hex");
      const adminToken = new AdminToken({
        token,
        issuedByAdmin: req.admin.id,
        expiresAt,
        purpose,
      });
      await adminToken.save();
      tokens.push(token);
    }

    // Update admin stats
    const admin = await Admin.findById(req.admin.id);
    admin.tokensIssued += qty;
    await admin.save();

    res.status(201).json({
      message: `${qty} token(s) generated successfully`,
      tokens,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending verification requests
const getPendingVerifications = async (req, res) => {
  try {
    const pending = await VerificationRequest.find({ status: "pending" }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      count: pending.length,
      requests: pending,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve verification request
const approveVerification = async (req, res) => {
  try {
    const { requestId, generateTokens = false } = req.body;

    const verReq = await VerificationRequest.findById(requestId);
    if (!verReq) {
      return res.status(404).json({ error: "Verification request not found" });
    }

    if (verReq.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    // Update existing placeholder (auto-created by ratings) or create fresh record
    let phoneNumber = await PhoneNumber.findOne({ phoneNumber: verReq.phoneNumber });
    if (phoneNumber) {
      phoneNumber.ownerName = verReq.ownerName;
      phoneNumber.verified = true;
      phoneNumber.verifiedByAdmin = req.admin.id;
      phoneNumber.verificationDate = new Date();
      phoneNumber.status = "verified";
      await phoneNumber.save();
    } else {
      phoneNumber = new PhoneNumber({
        phoneNumber: verReq.phoneNumber,
        ownerName: verReq.ownerName,
        verified: true,
        verifiedByAdmin: req.admin.id,
        verificationDate: new Date(),
        status: "verified",
      });
      await phoneNumber.save();
    }

    // Update verification request
    verReq.status = "approved";
    verReq.reviewedByAdmin = req.admin.id;
    verReq.reviewedAt = new Date();
    await verReq.save();

    // Update admin stats
    const admin = await Admin.findById(req.admin.id);
    admin.verificationsApproved += 1;
    await admin.save();

    // Generate token if requested
    if (generateTokens) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const adminToken = new AdminToken({
        token,
        issuedByAdmin: req.admin.id,
        expiresAt,
        usedByPhoneNumber: phoneNumber._id,
      });
      await adminToken.save();

      verReq.tokenGenerated = true;
      await verReq.save();

      res.status(200).json({
        message: "Phone number verified and token generated",
        phoneNumber: phoneNumber.phoneNumber,
        token,
      });
      return;
    }

    res.status(200).json({
      message: "Phone number verified successfully",
      phoneNumber: phoneNumber.phoneNumber,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject verification request
const rejectVerification = async (req, res) => {
  try {
    const { requestId } = req.body;

    const verReq = await VerificationRequest.findById(requestId);
    if (!verReq) {
      return res.status(404).json({ error: "Verification request not found" });
    }

    if (verReq.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    verReq.status = "rejected";
    verReq.rejectionReason = null;
    verReq.reviewedByAdmin = req.admin.id;
    verReq.reviewedAt = new Date();
    await verReq.save();

    // Update admin stats
    const admin = await Admin.findById(req.admin.id);
    admin.verificationsRejected += 1;
    await admin.save();

    res.status(200).json({
      message: "Verification request rejected",
      requestId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all tokens
const listTokens = async (req, res) => {
  try {
    const tokens = await AdminToken.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .select("token purpose isUsed usedAt expiresAt createdAt deactivated issuedByAdmin")
      .populate("issuedByAdmin", "username");

    res.status(200).json({ tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deactivate all active tokens
const deactivateAllTokens = async (req, res) => {
  try {
    const now = new Date();
    const result = await AdminToken.updateMany(
      { isUsed: { $ne: true }, deactivated: { $ne: true }, expiresAt: { $gt: now } },
      { $set: { isUsed: true, deactivated: true, usedAt: now } },
    );
    res.status(200).json({ message: `${result.modifiedCount} token(s) deactivated` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deactivate a token
const deactivateToken = async (req, res) => {
  try {
    const adminToken = await AdminToken.findById(req.params.id);
    if (!adminToken) {
      return res.status(404).json({ error: "Token not found" });
    }

    if (req.admin.role !== "super_admin" && String(adminToken.issuedByAdmin) !== String(req.admin.id)) {
      return res.status(403).json({ error: "You can only deactivate tokens you created" });
    }

    adminToken.isUsed = true;
    adminToken.usedAt = adminToken.usedAt ?? new Date();
    adminToken.deactivated = true;
    await adminToken.save();

    res.status(200).json({ message: "Token deactivated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new admin (super_admin only)
const createAdmin = async (req, res) => {
  try {
    const { username, email, password, role = 'admin' } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' })
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or super_admin' })
    }

    const existing = await Admin.findOne({ $or: [{ username }, { email }] })
    if (existing) {
      return res.status(409).json({ error: 'Username or email already in use' })
    }

    const newAdmin = new Admin({ username, email, password, role })
    await newAdmin.save()

    res.status(201).json({
      message: 'Admin created successfully',
      admin: { id: newAdmin._id, username: newAdmin.username, email: newAdmin.email, role: newAdmin.role },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// List all admins (super_admin only)
const listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 }).select('username email role isActive tokensIssued verificationsApproved verificationsRejected lastLogin createdAt')
    res.status(200).json({ admins })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Deactivate or reactivate admin account (super_admin only)
const toggleAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' })
    }

    const admin = await Admin.findById(adminId)
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    if (String(admin._id) === String(req.admin.id)) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' })
    }

    admin.isActive = isActive
    await admin.save()

    res.status(200).json({
      message: `Admin ${isActive ? 'reactivated' : 'deactivated'} successfully`,
      admin: { id: admin._id, username: admin.username, isActive: admin.isActive },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
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
};
