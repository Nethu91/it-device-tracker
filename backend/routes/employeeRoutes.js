const express = require("express");
const router = express.Router();

const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Location = require("../models/Location");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

/* =========================================
   DEPARTMENTS
========================================= */

// ADD DEPARTMENT
router.post(
  "/departments",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { Name } = req.body;

      if (!Name || Name.trim() === "") {
        return res.status(400).json({
          message: "Department name is required",
        });
      }

      const existingDepartment = await Department.findOne({
        Name: {
          $regex: `^${Name.trim()}$`,
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

      res.status(201).json(department);
    } catch (error) {
      console.log("Department add error:", error);

      res.status(500).json({
        message: "Department add failed",
        error: error.message,
      });
    }
  }
);

// GET ALL DEPARTMENTS
router.get(
  "/departments/all",
  protect,
  async (req, res) => {
    try {
      const departments = await Department.find().sort({
        Name: 1,
      });

      res.json(departments);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to fetch departments",
        error: error.message,
      });
    }
  }
);

/* =========================================
   LOCATIONS
========================================= */

// ADD LOCATION
router.post(
  "/locations",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { Name } = req.body;

      if (!Name || Name.trim() === "") {
        return res.status(400).json({
          message: "Location name is required",
        });
      }

      const existingLocation = await Location.findOne({
        Name: {
          $regex: `^${Name.trim()}$`,
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

      res.status(201).json(location);
    } catch (error) {
      console.log("Location add error:", error);

      res.status(500).json({
        message: "Location add failed",
        error: error.message,
      });
    }
  }
);

// GET ALL LOCATIONS
router.get(
  "/locations/all",
  protect,
  async (req, res) => {
    try {
      const locations = await Location.find().sort({
        Name: 1,
      });

      res.json(locations);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to fetch locations",
        error: error.message,
      });
    }
  }
);

/* =========================================
   EMPLOYEES
========================================= */

// ADD EMPLOYEE
router.post(
  "/",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      console.log("EMPLOYEE BODY:", req.body);

      const {
        FirstName,
        SecondName,
        EPFNumber,
        Department,
        Location,
        Status,
      } = req.body;

      // VALIDATION
      if (
        !FirstName ||
        !SecondName ||
        !EPFNumber ||
        !Department ||
        !Location
      ) {
        return res.status(400).json({
          message: "Please fill all employee fields",
        });
      }

      // CHECK DUPLICATE EPF
      const existingEmployee = await Employee.findOne({
        EPFNumber: Number(EPFNumber),
      });

      if (existingEmployee) {
        return res.status(400).json({
          message: "EPF Number already exists",
        });
      }

      // CREATE EMPLOYEE
      const employee = new Employee({
        FirstName: FirstName.trim(),
        SecondName: SecondName.trim(),
        FullName: `${FirstName.trim()} ${SecondName.trim()}`,
        EPFNumber: Number(EPFNumber),
        Department: Department.trim(),
        Location: Location.trim(),
        Status: Status || "Active",
      });

      await employee.save();

      res.status(201).json(employee);
    } catch (error) {
      console.log("EMPLOYEE SAVE ERROR:", error);

      res.status(500).json({
        message: "Failed to add employee",
        error: error.message,
      });
    }
  }
);

// GET ALL EMPLOYEES
router.get("/", protect, async (req, res) => {
  try {
    const employees = await Employee.find().sort({
      createdAt: -1,
    });

    res.json(employees);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
});

// SEARCH EMPLOYEE
router.get(
  "/search/:keyword",
  protect,
  async (req, res) => {
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
      console.log(error);

      res.status(500).json({
        message: "Employee search failed",
        error: error.message,
      });
    }
  }
);

// UPDATE EMPLOYEE
router.put(
  "/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const {
        FirstName,
        SecondName,
        EPFNumber,
        Department,
        Location,
        Status,
      } = req.body;

      const updatedEmployee =
        await Employee.findByIdAndUpdate(
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

      res.json(updatedEmployee);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to update employee",
        error: error.message,
      });
    }
  }
);

// DELETE EMPLOYEE
router.delete(
  "/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const deletedEmployee =
        await Employee.findByIdAndDelete(
          req.params.id
        );

      if (!deletedEmployee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      res.json({
        message: "Employee deleted successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to delete employee",
        error: error.message,
      });
    }
  }
);

module.exports = router;