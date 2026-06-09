const express = require("express");
const router = express.Router();

const CustomDevice = require("../models/CustomDevice");
const DeviceTemplate = require("../models/DeviceTemplate");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/* =========================================
   SAVE CUSTOM DEVICE
   Normal users + Admin users can add data
========================================= */
router.post("/", protect, async (req, res) => {
  try {
    const { templateId, data, status } = req.body;

    if (!templateId) {
      return res.status(400).json({
        message: "Template ID is required",
      });
    }

    const template = await DeviceTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({
        message: "Device interface not found",
      });
    }

    for (const field of template.fields) {
      if (field.required && !data?.[field.name]) {
        return res.status(400).json({
          message: `${field.label} is required`,
        });
      }
    }

    const customDevice = await CustomDevice.create({
      templateId,
      templateName: template.name,
      data: data || {},
      status: status || "Available",
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Custom device saved successfully",
      customDevice,
    });
  } catch (error) {
    console.error("Save custom device error:", error);

    res.status(500).json({
      message: "Failed to save custom device",
      error: error.message,
    });
  }
});

/* =========================================
   GET ALL CUSTOM DEVICES
   Normal users + Admin users can view
========================================= */
router.get("/", protect, async (req, res) => {
  try {
    const devices = await CustomDevice.find()
      .populate("templateId")
      .sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    console.error("Load all custom devices error:", error);

    res.status(500).json({
      message: "Failed to load custom devices",
      error: error.message,
    });
  }
});

/* =========================================
   GET CUSTOM DEVICES BY TEMPLATE
   Normal users + Admin users can view
========================================= */
router.get("/template/:templateId", protect, async (req, res) => {
  try {
    const devices = await CustomDevice.find({
      templateId: req.params.templateId,
    }).sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    console.error("Load template custom devices error:", error);

    res.status(500).json({
      message: "Failed to load custom devices",
      error: error.message,
    });
  }
});

/* =========================================
   GET SINGLE CUSTOM DEVICE
   Normal users + Admin users can view
========================================= */
router.get("/:id", protect, async (req, res) => {
  try {
    const device = await CustomDevice.findById(req.params.id).populate(
      "templateId"
    );

    if (!device) {
      return res.status(404).json({
        message: "Custom device not found",
      });
    }

    res.json(device);
  } catch (error) {
    console.error("Load custom device error:", error);

    res.status(500).json({
      message: "Failed to load custom device",
      error: error.message,
    });
  }
});

/* =========================================
   UPDATE CUSTOM DEVICE
   Admin only
========================================= */
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { data, status } = req.body;

    const customDevice = await CustomDevice.findById(req.params.id);

    if (!customDevice) {
      return res.status(404).json({
        message: "Custom device not found",
      });
    }

    const template = await DeviceTemplate.findById(customDevice.templateId);

    if (!template) {
      return res.status(404).json({
        message: "Device interface not found",
      });
    }

    for (const field of template.fields) {
      if (field.required && !data?.[field.name]) {
        return res.status(400).json({
          message: `${field.label} is required`,
        });
      }
    }

    customDevice.data = data || {};
    customDevice.status = status || customDevice.status || "Available";
    customDevice.templateName = template.name;

    await customDevice.save();

    res.json({
      message: "Custom device updated successfully",
      customDevice,
    });
  } catch (error) {
    console.error("Update custom device error:", error);

    res.status(500).json({
      message: "Failed to update custom device",
      error: error.message,
    });
  }
});

/* =========================================
   DELETE CUSTOM DEVICE
   Admin only
========================================= */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deletedDevice = await CustomDevice.findByIdAndDelete(req.params.id);

    if (!deletedDevice) {
      return res.status(404).json({
        message: "Custom device not found",
      });
    }

    res.json({
      message: "Custom device deleted successfully",
    });
  } catch (error) {
    console.error("Delete custom device error:", error);

    res.status(500).json({
      message: "Failed to delete custom device",
      error: error.message,
    });
  }
});

module.exports = router;