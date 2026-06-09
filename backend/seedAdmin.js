require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const adminEmail = "nethmini@swisstekaluminium.com";

    const existingAdmin = await User.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.authProvider = "microsoft";
      existingAdmin.username = "Sewwandi Nethmini";

      await existingAdmin.save();

      console.log("Admin user already existed. Updated as admin.");
      process.exit(0);
    }

    const adminUser = new User({
      username: "Sewwandi Nethmini",
      email: adminEmail.toLowerCase(),
      password: "",
      role: "admin",
      phone: "",
      department: "",
      position: "",
      profilePicture: "",
      authProvider: "microsoft",
    });

    await adminUser.save();

    console.log("Admin user created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed admin error:", error.message);
    process.exit(1);
  }
};

seedAdmin();