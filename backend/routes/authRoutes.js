const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const User = require("../models/User");

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

// ADMIN ONLY REGISTER
router.post(
  "/register",
  protect,
  adminOnly,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        role,
        profilePicture: req.file ? req.file.filename : "",
      });

      await user.save();

      res.status(201).json({
        message: "User created successfully",
      });
    } catch (error) {
      console.log("Register error:", error);
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "jwtSecret",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// UPDATE PROFILE
router.put("/profile/:id", upload.single("profilePicture"), async (req, res) => {
  try {
    const { username, email, phone, department, position } = req.body;

    const updateData = {
      username,
      email,
      phone,
      department,
      position,
    };

    if (req.file) {
      updateData.profilePicture = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        department: updatedUser.department,
        position: updatedUser.position,
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.log("Profile update error:", error);
    res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
});

// CHANGE PASSWORD
router.put("/change-password/:id", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
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