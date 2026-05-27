const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("../src/models/Admin");

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("✗ Admin user already exists");
      process.exit(0);
    }

    // Create admin
    const admin = new Admin({
      username: "admin",
      email: "admin@example.com",
      password: "SecurePassword123!", // Change this!
      role: "super_admin",
    });

    await admin.save();
    console.log("✓ Admin user created successfully");
    console.log(`
    Admin Credentials:
    Username: admin
    Password: SecurePassword123!
    
    ⚠️  IMPORTANT: Change the password immediately after first login!
    `);

    process.exit(0);
  } catch (error) {
    console.error("✗ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdminUser();
