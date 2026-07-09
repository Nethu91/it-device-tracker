const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const multer = require("multer");

const Employee   = require("../models/Employee");
const Department = require("../models/Department");
const Location   = require("../models/Location");
const User       = require("../models/User");
const Device     = require("../models/Device");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* =========================================
   MULTER — memory storage (max 5MB)
========================================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported. Allowed: PDF, JPG, PNG, DOC, DOCX"));
    }
  },
});

/* =========================================
   HELPER FUNCTIONS
========================================= */

const escapeRegex = (text) => {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeBoolean = (value) => {
  if (value === false || value === "false" || value === "0" || value === 0) {
    return false;
  }
  return true;
};

const getEmployeePayload = (body) => {
  const firstName  = body.FirstName  || body.firstName  || "";
  const secondName = body.SecondName || body.secondName || "";
  const epfNumber  = body.EPFNumber  || body.epfNumber  || body.EPF || body.epf || "";
  const department = body.Department || body.department || "";
  const location    = body.Location   || body.location   || "";
  const status      = body.Status     || body.status     || "Active";

  const companyEmail = body.CompanyEmail || body.companyEmail || "";
  const accessRole   = body.AccessRole   || body.accessRole   || "user";
  const canLogin = body.CanLogin !== undefined ? body.CanLogin : body.canLogin;

  const adminUsername = body.AdminUsername || body.adminUsername || "";
  const adminPassword = body.AdminPassword || body.adminPassword || "";

  return {
    FirstName: String(firstName).trim(),
    SecondName: String(secondName).trim(),
    EPFNumber: String(epfNumber).trim(),
    Department: String(department).trim(),
    Location: String(location).trim(),
    Status: String(status).trim() || "Active",

    CompanyEmail: String(companyEmail).toLowerCase().trim(),
    AccessRole: accessRole === "admin" ? "admin" : "user",
    CanLogin: normalizeBoolean(canLogin),

    AdminUsername: String(adminUsername).trim(),
    AdminPassword: String(adminPassword).trim(),
  };
};

const createOrUpdateAdminAccount = async ({
  CompanyEmail, AdminUsername, AdminPassword, Department,
}) => {
  if (!CompanyEmail) throw new Error("Company email is required for admin access");
  if (!AdminUsername) throw new Error("Admin username is required");

  const existingAdmin = await User.findOne({ email: CompanyEmail });

  const adminData = {
    username: AdminUsername,
    email: CompanyEmail,
    role: "admin",
    authProvider: "local",
    department: Department || "",
    position: "",
  };

  if (AdminPassword) {
    adminData.password = await bcrypt.hash(AdminPassword, 10);
  } else if (!existingAdmin) {
    throw new Error("Admin password is required for new admin account");
  }

  await User.findOneAndUpdate({ email: CompanyEmail }, adminData, { upsert: true, new: true });
};

const releaseDevicesForEmployee = async (epfNumber, employeeName) => {
  if (!epfNumber) return { releasedCount: 0 };

  const assignedDevices = await Device.find({
    EPFNumber: Number(epfNumber),
    isDisposed: { $ne: true },
  });

  let releasedCount = 0;

  for (const device of assignedDevices) {
    // Previous Users history add 
    const previousUsers = Array.isArray(device.PreviousUsers) ? device.PreviousUsers : [];
    if (device.EmployeeName && !previousUsers.includes(device.EmployeeName)) {
      previousUsers.push(device.EmployeeName);
    }

    device.PreviousUsers        = previousUsers;
    device.EmployeeName         = "";
    device.EPFNumber            = null;
    device.Designation          = "";
    device.Status               = "Available";
    device.releasedAt           = new Date();
    device.releasedFromEmployee = employeeName || "";
    device.releasedFromEPF      = Number(epfNumber);

    await device.save();
    releasedCount++;
  }

  return { releasedCount };
};

router.post("/departments", protect, adminOnly, async (req, res) => {
  try {
    const Name = req.body.Name || req.body.name || "";
    if (!Name || Name.trim() === "") {
      return res.status(400).json({ message: "Department name is required" });
    }
    const existingDepartment = await Department.findOne({
      Name: { $regex: `^${escapeRegex(Name.trim())}$`, $options: "i" },
    });
    if (existingDepartment) {
      return res.status(400).json({ message: "Department already exists" });
    }
    const department = new Department({ Name: Name.trim() });
    await department.save();
    res.status(201).json({ message: "Department added successfully", department });
  } catch (error) {
    console.log("Department add error:", error);
    res.status(500).json({ message: "Department add failed", error: error.message });
  }
});

router.get("/departments/all", protect, async (req, res) => {
  try {
    const departments = await Department.find().sort({ Name: 1 });
    res.json(departments);
  } catch (error) {
    console.log("Department fetch error:", error);
    res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
});

/* =========================================
   LOCATIONS
========================================= */

router.post("/locations", protect, adminOnly, async (req, res) => {
  try {
    const Name = req.body.Name || req.body.name || "";
    if (!Name || Name.trim() === "") {
      return res.status(400).json({ message: "Location name is required" });
    }
    const existingLocation = await Location.findOne({
      Name: { $regex: `^${escapeRegex(Name.trim())}$`, $options: "i" },
    });
    if (existingLocation) {
      return res.status(400).json({ message: "Location already exists" });
    }
    const location = new Location({ Name: Name.trim() });
    await location.save();
    res.status(201).json({ message: "Location added successfully", location });
  } catch (error) {
    console.log("Location add error:", error);
    res.status(500).json({ message: "Location add failed", error: error.message });
  }
});

router.get("/locations/all", protect, async (req, res) => {
  try {
    const locations = await Location.find().sort({ Name: 1 });
    res.json(locations);
  } catch (error) {
    console.log("Location fetch error:", error);
    res.status(500).json({ message: "Failed to fetch locations", error: error.message });
  }
});

/* =========================================
   EMPLOYEES + ACCESS MANAGEMENT
========================================= */

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    console.log("EMPLOYEE BODY:", req.body);

    const {
      FirstName, SecondName, EPFNumber, Department, Location, Status,
      CompanyEmail, AccessRole, CanLogin, AdminUsername, AdminPassword,
    } = getEmployeePayload(req.body);

    if (!FirstName || !SecondName || !EPFNumber || !Department || !Location) {
      return res.status(400).json({ message: "Please fill all employee fields", received: req.body });
    }

    const existingEmployee = await Employee.findOne({ EPFNumber: Number(EPFNumber) });
    if (existingEmployee) {
      return res.status(400).json({ message: "EPF Number already exists" });
    }

    if (CompanyEmail) {
      const existingEmail = await Employee.findOne({ CompanyEmail });
      if (existingEmail) {
        return res.status(400).json({ message: "Company email already exists" });
      }
    }

    if (AccessRole === "admin") {
      if (!CompanyEmail) {
        return res.status(400).json({ message: "Company email is required for admin access" });
      }
      if (!AdminUsername || !AdminPassword) {
        return res.status(400).json({ message: "Admin username and password are required" });
      }
    }

    const employee = new Employee({
      FirstName, SecondName, FullName: `${FirstName} ${SecondName}`,
      EPFNumber: Number(EPFNumber), Department, Location, Status,
      CompanyEmail, AccessRole, CanLogin,
    });

    await employee.save();

    if (AccessRole === "admin") {
      await createOrUpdateAdminAccount({ CompanyEmail, AdminUsername, AdminPassword, Department });
    }

    res.status(201).json({ message: "Employee added successfully", employee });
  } catch (error) {
    console.log("EMPLOYEE SAVE ERROR:", error);
    res.status(500).json({ message: "Failed to add employee", error: error.message });
  }
});

// ✅ GET ALL — excludes heavy fileData field for fast list loading
router.get("/", protect, async (req, res) => {
  try {
    const employees = await Employee.find()
      .select("-Attachments.fileData")
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.log("Employee fetch error:", error);
    res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
});

router.get("/search/:keyword", protect, async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const query = {
      $or: [
        { FullName: { $regex: keyword, $options: "i" } },
        { FirstName: { $regex: keyword, $options: "i" } },
        { SecondName: { $regex: keyword, $options: "i" } },
        { Department: { $regex: keyword, $options: "i" } },
        { Location: { $regex: keyword, $options: "i" } },
        { CompanyEmail: { $regex: keyword, $options: "i" } },
        { AccessRole: { $regex: keyword, $options: "i" } },
      ],
    };
    if (!isNaN(keyword)) {
      query.$or.push({ EPFNumber: Number(keyword) });
    }
    const employees = await Employee.find(query).select("-Attachments.fileData").limit(10);
    res.json(employees);
  } catch (error) {
    console.log("Employee search error:", error);
    res.status(500).json({ message: "Employee search failed", error: error.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    console.log("UPDATE EMPLOYEE BODY:", req.body);

    const {
      FirstName, SecondName, EPFNumber, Department, Location, Status,
      CompanyEmail, AccessRole, CanLogin, AdminUsername, AdminPassword,
    } = getEmployeePayload(req.body);

    if (!FirstName || !SecondName || !EPFNumber || !Department || !Location) {
      return res.status(400).json({ message: "Please fill all employee fields", received: req.body });
    }

    const duplicateEmployee = await Employee.findOne({
      EPFNumber: Number(EPFNumber), _id: { $ne: req.params.id },
    });
    if (duplicateEmployee) {
      return res.status(400).json({ message: "EPF Number already exists" });
    }

    if (CompanyEmail) {
      const duplicateEmail = await Employee.findOne({
        CompanyEmail, _id: { $ne: req.params.id },
      });
      if (duplicateEmail) {
        return res.status(400).json({ message: "Company email already exists" });
      }
    }

    if (AccessRole === "admin" && !CompanyEmail) {
      return res.status(400).json({ message: "Company email is required for admin access" });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        FirstName, SecondName, FullName: `${FirstName} ${SecondName}`,
        EPFNumber: Number(EPFNumber), Department, Location, Status,
        CompanyEmail, AccessRole, CanLogin,
      },
      { new: true }
    ).select("-Attachments.fileData");

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (AccessRole === "admin") {
      await createOrUpdateAdminAccount({
        CompanyEmail, AdminUsername: AdminUsername || CompanyEmail, AdminPassword, Department,
      });
    }

    // ✅ Employee Status → Inactive වුණොත්, assign වුණ devices auto-release කරනවා
    let releaseResult = { releasedCount: 0 };
    if (Status === "Inactive") {
      releaseResult = await releaseDevicesForEmployee(
        Number(EPFNumber),
        updatedEmployee.FullName || `${FirstName} ${SecondName}`
      );
    }

    res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
      devicesReleased: releaseResult.releasedCount,
    });
  } catch (error) {
    console.log("Employee update error:", error);
    res.status(500).json({ message: "Failed to update employee", error: error.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.log("Employee delete error:", error);
    res.status(500).json({ message: "Failed to delete employee", error: error.message });
  }
});

/* =========================================
   ATTACHMENTS — Admin only
   Stored directly in MongoDB as Base64 (no Cloudinary)
========================================= */

// ✅ UPLOAD ATTACHMENT
router.post(
  "/:id/attachments",
  protect,
  adminOnly,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const attachment = {
        fileName: req.file.originalname,
        fileData: req.file.buffer.toString("base64"),
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedAt: new Date(),
      };

      employee.Attachments.push(attachment);
      await employee.save();

      // Return employee WITH fileData so the modal can render it immediately
      res.status(201).json({
        message: "Attachment uploaded successfully",
        employee,
      });
    } catch (error) {
      console.log("Attachment upload error:", error);
      if (error.message && error.message.includes("File too large")) {
        return res.status(400).json({ message: "File exceeds 5MB limit" });
      }
      res.status(500).json({ message: "Failed to upload attachment", error: error.message });
    }
  }
);

// ✅ GET ALL ATTACHMENTS for an employee (includes fileData — used to open the modal)
router.get("/:id/attachments", protect, adminOnly, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee.Attachments || []);
  } catch (error) {
    console.log("Get attachments error:", error);
    res.status(500).json({ message: "Failed to fetch attachments", error: error.message });
  }
});

// ✅ DELETE ATTACHMENT
router.delete("/:id/attachments/:attachmentId", protect, adminOnly, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const attachment = employee.Attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    employee.Attachments.pull(req.params.attachmentId);
    await employee.save();

    res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.log("Delete attachment error:", error);
    res.status(500).json({ message: "Failed to delete attachment", error: error.message });
  }
});

module.exports = router;