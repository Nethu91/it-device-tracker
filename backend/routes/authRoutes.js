const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const User = require("../models/User");
const verifyMicrosoftToken = require("../middleware/microsoftVerify");

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const createAppToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || "jwtSecret",
    {
      expiresIn: "7d",
    }
  );
};

const formatUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  department: user.department || "",
  position: user.position || "",
  profilePicture: user.profilePicture || "",
  authProvider: user.authProvider || "local",
});

/* =========================================
   ADMIN ONLY REGISTER
   Used by User Management
========================================= */

router.post(
  "/register",
  protect,
  adminOnly,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { username, email, password, role, phone, department, position } =
        req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          message: "Username, email and password are required",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email: normalizedEmail,
      });

      if (existingUser) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "user",
        phone: phone || "",
        department: department || "",
        position: position || "",
        profilePicture: req.file ? req.file.filename : "",
        authProvider: "local",
      });

      await user.save();

      res.status(201).json({
        message: "User created successfully",
        user: formatUser(user),
      });
    } catch (error) {
      console.log("Register error:", error);

      res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
  }
);

/* =========================================
   EMAIL PASSWORD LOGIN
========================================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    if (user.authProvider === "microsoft" || !user.password) {
      return res.status(400).json({
        message: "Please login with Microsoft",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = createAppToken(user);

    res.json({
      message: "Login successful",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.log("Login error:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

/* =========================================
   SECURE MICROSOFT LOGIN
   Only User Management approved users can login
========================================= */

router.post("/microsoft-login", async (req, res) => {
  try {
    console.log("MICROSOFT LOGIN API HIT");

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "Microsoft ID token is required",
      });
    }

    const decoded = await verifyMicrosoftToken(idToken);

    console.log("MICROSOFT DECODED TOKEN:", decoded);

    const email =
      decoded.preferred_username ||
      decoded.email ||
      decoded.upn ||
      decoded.unique_name;

    const username =
      decoded.name ||
      decoded.given_name ||
      (email ? email.split("@")[0] : "Microsoft User");

    if (!email) {
      return res.status(400).json({
        message: "Microsoft account email not found",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith("@swisstekaluminium.com")) {
      return res.status(403).json({
        message: "Only Swisstek company emails are allowed",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(403).json({
        message:
          "Your Microsoft account is not approved. Please contact the system administrator.",
      });
    }

    user.authProvider = "microsoft";

    if (!user.username) {
      user.username = username;
    }

    await user.save();

    console.log("MICROSOFT USER APPROVED:", user);

    const token = createAppToken(user);

    res.status(200).json({
      message: "Microsoft login successful",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.log("Microsoft token verify error:", error);

    res.status(401).json({
      message: "Microsoft login verification failed",
      error: error.message,
    });
  }
});

/* =========================================
   GET LOGGED USER PROFILE
========================================= */

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: formatUser(user),
    });
  } catch (error) {
    console.log("Get profile error:", error);

    res.status(500).json({
      message: "Profile load failed",
      error: error.message,
    });
  }
});

/* =========================================
   UPDATE PROFILE
   Normal user cannot change email
   Admin can change email
========================================= */

router.put(
  "/profile/:id",
  protect,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { username, email, phone, department, position } = req.body;

      if (req.user.id !== req.params.id && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Not allowed to update this profile",
        });
      }

      const updateData = {
        username,
        phone,
        department,
        position,
      };

      if (email && req.user.role === "admin") {
        updateData.email = email.toLowerCase().trim();
      }

      if (req.file) {
        updateData.profilePicture = req.file.filename;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
        }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.json({
        message: "Profile updated successfully",
        user: formatUser(updatedUser),
      });
    } catch (error) {
      console.log("Profile update error:", error);

      res.status(500).json({
        message: "Profile update failed",
        error: error.message,
      });
    }
  }
);
/* =========================================
   GET ALL USERS - ADMIN ONLY
========================================= */

router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.log("Get users error:", error);

    res.status(500).json({
      message: "Failed to load users",
      error: error.message,
    });
  }
});

/* =========================================
   DELETE USER - ADMIN ONLY
========================================= */

router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log("Delete user error:", error);

    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
});
/* =========================================
   CHANGE PASSWORD
========================================= */

router.put("/change-password/:id", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Not allowed to change this password",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.authProvider === "microsoft" || !user.password) {
      return res.status(400).json({
        message: "Microsoft users cannot change password here",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Password change error:", error);

    res.status(500).json({
      message: "Password change failed",
      error: error.message,
    });
  }
});

module.exports = router;