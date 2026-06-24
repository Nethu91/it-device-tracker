const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Employee = require("../models/Employee");
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

/* =========================================
   TOKEN HELPERS
========================================= */

const createAdminToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: "admin",
      email: user.email,
      authProvider: user.authProvider || "local",
      type: "admin",
    },
    process.env.JWT_SECRET || "jwtSecret",
    {
      expiresIn: "7d",
    }
  );
};

/*
  IMPORTANT:
  Microsoft login is only for employees.
  Even if employee.AccessRole is "admin", Microsoft login must get role "user".
  Admin full access is allowed only through username/password login.
*/
const createEmployeeToken = (employee) => {
  return jwt.sign(
    {
      id: employee._id,
      employeeId: employee._id,
      role: "user",
      email: employee.CompanyEmail,
      authProvider: "microsoft",
      type: "employee",
    },
    process.env.JWT_SECRET || "jwtSecret",
    {
      expiresIn: "7d",
    }
  );
};

const formatUser = (user) => ({
  id: user._id,
  _id: user._id,
  username: user.username,
  email: user.email,
  role: "admin",
  phone: user.phone || "",
  department: user.department || "",
  position: user.position || "",
  profilePicture: user.profilePicture || "",
  authProvider: user.authProvider || "local",
  type: "admin",
});

const formatEmployeeUser = (employee, microsoftName = "") => {
  const fullName = `${employee.FirstName || ""} ${
    employee.SecondName || ""
  }`.trim();

  return {
    id: employee._id,
    _id: employee._id,
    username: fullName || microsoftName || employee.CompanyEmail,
    email: employee.CompanyEmail,

    // IMPORTANT: Microsoft login never grants admin privileges
    role: "user",

    authProvider: "microsoft",
    type: "employee",

    EPFNumber: employee.EPFNumber || "",
    FirstName: employee.FirstName || "",
    SecondName: employee.SecondName || "",
    Department: employee.Department || "",
    Location: employee.Location || "",
    Position: employee.Position || "",
    Designation: employee.Designation || "",
    CompanyEmail: employee.CompanyEmail || "",
    CanLogin: employee.CanLogin !== false,
  };
};

/* =========================================
   ADMIN ONLY REGISTER
   Creates admin credentials only
========================================= */

router.post(
  "/register",
  protect,
  adminOnly,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { username, email, password, phone, department, position } =
        req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          message: "Username, email and password are required",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({
        $or: [
          { email: normalizedEmail },
          { username: username.trim() },
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Admin account already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        phone: phone || "",
        department: department || "",
        position: position || "",
        profilePicture: req.file ? req.file.filename : "",
        authProvider: "local",
      });

      await user.save();

      res.status(201).json({
        message: "Admin account created successfully",
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
   EMAIL / USERNAME PASSWORD LOGIN
   Admins only
========================================= */

router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const loginId = email || username;

    if (!loginId) {
      return res.status(400).json({
        message: "Admin email or username is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const normalizedLoginId = loginId.toLowerCase().trim();

    const user = await User.findOne({
      $or: [
        { email: normalizedLoginId },
        { username: normalizedLoginId },
      ],
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid admin email or username",
      });
    }

    if (user.authProvider === "microsoft" || !user.password) {
      return res.status(400).json({
        message: "Please login with Microsoft",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Normal users must login with Microsoft",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = createAdminToken(user);

    user.lastLogin = new Date();
user.loginCount = (user.loginCount || 0) + 1;
await user.save();

    res.json({
      message: "Admin login successful",
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
   Checks employees collection
   Always returns user role only
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

    const microsoftName =
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

    const employee = await Employee.findOne({
      CompanyEmail: normalizedEmail,
    });

    if (!employee) {
      return res.status(403).json({
        message:
          "Your Microsoft account is not approved. Please contact the system administrator.",
      });
    }

    if (employee.CanLogin === false) {
      return res.status(403).json({
        message:
          "Your account login access is disabled. Please contact the system administrator.",
      });
    }

    if (!employee.CompanyEmail) {
      employee.CompanyEmail = normalizedEmail;
    }

    await employee.save();

    console.log("MICROSOFT EMPLOYEE APPROVED:", normalizedEmail);

    employee.lastLogin = new Date();
employee.loginCount = (employee.loginCount || 0) + 1;
await employee.save();

    const token = createEmployeeToken(employee);

    res.status(200).json({
      message: "Microsoft login successful",
      token,
      user: formatEmployeeUser(employee, microsoftName),
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
   Supports admin users and employee Microsoft users
========================================= */

router.get("/profile", protect, async (req, res) => {
  try {

    // ✅ ADD THIS (OPTION 1 SAFETY CHECK)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }

    if (req.user.type === "employee" || req.user.authProvider === "microsoft") {
      const employee = await Employee.findById(req.user.id);

      if (!employee) {
        return res.status(404).json({
          message: "Employee profile not found",
        });
      }

      return res.json({
        user: formatEmployeeUser(employee),
      });
    }

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
   Admin can update admin profile
   Employee Microsoft users cannot change email here
========================================= */

router.put(
  "/profile/:id",
  protect,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { username, email, phone, department, position } = req.body;

      if (req.user.type === "employee" || req.user.authProvider === "microsoft") {
        if (req.user.id !== req.params.id) {
          return res.status(403).json({
            message: "Not allowed to update this profile",
          });
        }

        const updateEmployeeData = {
          Department: department,
          Position: position,
        };

        const updatedEmployee = await Employee.findByIdAndUpdate(
          req.params.id,
          updateEmployeeData,
          {
            new: true,
          }
        );

        if (!updatedEmployee) {
          return res.status(404).json({
            message: "Employee not found",
          });
        }

        return res.json({
          message: "Profile updated successfully",
          user: formatEmployeeUser(updatedEmployee),
        });
      }

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
   GET ALL ADMIN USERS - ADMIN ONLY
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
   DELETE ADMIN USER - ADMIN ONLY
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
   Admin local accounts only
========================================= */

router.put("/change-password/:id", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.type === "employee" || req.user.authProvider === "microsoft") {
      return res.status(400).json({
        message: "Microsoft users cannot change password here",
      });
    }

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