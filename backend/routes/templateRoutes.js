const express = require("express");
const router = express.Router();

const DeviceTemplate = require("../models/DeviceTemplate");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const makeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, description, fields } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Interface name is required",
      });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        message: "At least one field is required",
      });
    }

    const slug = makeSlug(name);

    const existing = await DeviceTemplate.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });

    if (existing) {
      return res.status(400).json({
        message: "Interface already exists",
      });
    }

    const cleanedFields = fields
      .filter((field) => field.label && field.label.trim() !== "")
      .map((field) => ({
        label: field.label.trim(),
        name: makeSlug(field.label).replaceAll("-", "_"),
        type: field.type || "text",
        required: Boolean(field.required),
        options:
          field.type === "select"
            ? String(field.options || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
      }));

    const template = await DeviceTemplate.create({
      name: name.trim(),
      slug,
      description: description || "",
      fields: cleanedFields,
      createdBy: req.user.id,
      isActive: true,
    });

    res.status(201).json({
      message: "Device interface created successfully",
      template,
    });
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({
      message: "Failed to create device interface",
      error: error.message,
    });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const templates = await DeviceTemplate.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.json(templates);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load templates",
      error: error.message,
    });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const template = await DeviceTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load template",
      error: error.message,
    });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const template = await DeviceTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        message: "Interface not found",
      });
    }

    res.json({
      message: "Interface removed successfully",
      template,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove interface",
      error: error.message,
    });
  }
});

module.exports = router;