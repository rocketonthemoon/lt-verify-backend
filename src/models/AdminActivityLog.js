const mongoose = require("mongoose");

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    adminUsername: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "APPROVE_VERIFICATION",
        "REJECT_VERIFICATION",
        "GENERATE_TOKEN",
        "DEACTIVATE_TOKEN",
        "DEACTIVATE_ALL_TOKENS",
        "CREATE_ADMIN",
        "TOGGLE_ADMIN_STATUS",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1, createdAt: -1 });
adminActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminActivityLog", adminActivityLogSchema);
