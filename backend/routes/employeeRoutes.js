const express = require("express");
const router = express.Router();

const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Location = require("../models/Location");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* =========================================
   HELPER FUNCTIONS
========================================= */

const escapeRegex = (text) => {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getEmployeePayload = (body) => {
  const firstName = body.FirstName || body.firstName || "";
  const secondName = body.SecondName || body.secondName || "";
  const epfNumber = body.EPFNumber || body.epfNumber || body.EPF || body.epf || "";
  const department = body.Department || body.department || "";
  const location = body.Location || body.location || "";
  const status = body.Status || body.status || "Active";

  return {
    FirstName: String(firstName).trim(),
    SecondName: String(secondName).trim(),
    EPFNumber: String(epfNumber).trim(),
    Department: String(department).trim(),
    Location: String(location).trim(),
    Status: String(status).trim() || "Active",
  };
};

/* =========================================
   DEPARTMENTS
========================================= */

// ADD DEPARTMENT
router.post("/departments", protect, adminOnly, async (req, res) => {
  try {
    const Name = req.body.Name || req.body.name || "";

    if (!Name || Name.trim() === "") {
      return res.status(400).json({
        message: "Department name is required",
      });
    }

    const existingDepartment = await Department.findOne({
      Name: {
        $regex: `^${escapeRegex(Name.trim())}$`,
        $options: "i",
      },
    });

    if (existingDepartment) {
      return res.status(400).json({
        message: "Department already exists",
      });
    }

    const department = new Department({
      Name: Name.trim(),
    });

    await department.save();

    res.status(201).json({
      message: "Department added successfully",
      department,
    });
  } catch (error) {
    console.log("Department add error:", error);

    res.status(500).json({
      message: "Department add failed",
      error: error.message,
    });
  }
});

// GET ALL DEPARTMENTS
router.get("/departments/all", protect, async (req, res) => {
  try {
    const departments = await Department.find().sort({
      Name: 1,
    });

    res.json(departments);
  } catch (error) {
    console.log("Department fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
});

/* =========================================
   LOCATIONS
========================================= */

// ADD LOCATION
router.post("/locations", protect, adminOnly, async (req, res) => {
  try {
    const Name = req.body.Name || req.body.name || "";

    if (!Name || Name.trim() === "") {
      return res.status(400).json({
        message: "Location name is required",
      });
    }

    const existingLocation = await Location.findOne({
      Name: {
        $regex: `^${escapeRegex(Name.trim())}$`,
        $options: "i",
      },
    });

    if (existingLocation) {
      return res.status(400).json({
        message: "Location already exists",
      });
    }

    const location = new Location({
      Name: Name.trim(),
    });

    await location.save();

    res.status(201).json({
      message: "Location added successfully",
      location,
    });
  } catch (error) {
    console.log("Location add error:", error);

    res.status(500).json({
      message: "Location add failed",
      error: error.message,
    });
  }
});

// GET ALL LOCATIONS
router.get("/locations/all", protect, async (req, res) => {
  try {
    const locations = await Location.find().sort({
      Name: 1,
    });

    res.json(locations);
  } catch (error) {
    console.log("Location fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch locations",
      error: error.message,
    });
  }
});

/* =========================================
   EMPLOYEES
========================================= */

// ADD EMPLOYEE
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    console.log("EMPLOYEE BODY:", req.body);

    const {
      FirstName,
      SecondName,
      EPFNumber,
      Department,
      Location,
      Status,
    } = getEmployeePayload(req.body);

    if (!FirstName || !SecondName || !EPFNumber || !Department || !Location) {
      return res.status(400).json({
        message: "Please fill all employee fields",
        received: req.body,
      });
    }

    const existingEmployee = await Employee.findOne({
      EPFNumber: Number(EPFNumber),
    });

    if (existingEmployee) {
      return res.status(400).json({
        message: "EPF Number already exists",
      });
    }

    const employee = new Employee({
      FirstName,
      SecondName,
      FullName: `${FirstName} ${SecondName}`,
      EPFNumber: Number(EPFNumber),
      Department,
      Location,
      Status,
    });

    await employee.save();

    res.status(201).json({
      message: "Employee added successfully",
      employee,
    });
  } catch (error) {
    console.log("EMPLOYEE SAVE ERROR:", error);

    res.status(500).json({
      message: "Failed to add employee",
      error: error.message,
    });
  }
});

// GET ALL EMPLOYEES
router.get("/", protect, async (req, res) => {
  try {
    const employees = await Employee.find().sort({
      createdAt: -1,
    });

    res.json(employees);
  } catch (error) {
    console.log("Employee fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
});

// SEARCH EMPLOYEE
router.get("/search/:keyword", protect, async (req, res) => {
  try {
    const keyword = req.params.keyword;

    const query = {
      $or: [
        {
          FullName: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          FirstName: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          SecondName: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          Department: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          Location: {
            $regex: keyword,
            $options: "i",
          },
        },
      ],
    };

    if (!isNaN(keyword)) {
      query.$or.push({
        EPFNumber: Number(keyword),
      });
    }

    const employees = await Employee.find(query).limit(10);

    res.json(employees);
  } catch (error) {
    console.log("Employee search error:", error);

    res.status(500).json({
      message: "Employee search failed",
      error: error.message,
    });
  }
});

// UPDATE EMPLOYEE
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    console.log("UPDATE EMPLOYEE BODY:", req.body);

    const {
      FirstName,
      SecondName,
      EPFNumber,
      Department,
      Location,
      Status,
    } = getEmployeePayload(req.body);

    if (!FirstName || !SecondName || !EPFNumber || !Department || !Location) {
      return res.status(400).json({
        message: "Please fill all employee fields",
        received: req.body,
      });
    }

    const duplicateEmployee = await Employee.findOne({
      EPFNumber: Number(EPFNumber),
      _id: { $ne: req.params.id },
    });

    if (duplicateEmployee) {
      return res.status(400).json({
        message: "EPF Number already exists",
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        FirstName,
        SecondName,
        FullName: `${FirstName} ${SecondName}`,
        EPFNumber: Number(EPFNumber),
        Department,
        Location,
        Status,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.log("Employee update error:", error);

    res.status(500).json({
      message: "Failed to update employee",
      error: error.message,
    });
  }
});

// DELETE EMPLOYEE
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);

    if (!deletedEmployee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.log("Employee delete error:", error);

    res.status(500).json({
      message: "Failed to delete employee",
      error: error.message,
    });
  }
});

module.exports = router;