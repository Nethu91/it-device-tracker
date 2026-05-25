const express = require("express");
const router = express.Router();
const Device = require("../models/Device");

// ADD DEVICE
router.post("/", async (req, res) => {
  try {
    const newDevice = new Device(req.body);
    const savedDevice = await newDevice.save();
    res.status(201).json(savedDevice);
  } catch (error) {
    console.error("Add device error:", error);
    res.status(500).json({
      message: "Failed to add device",
      error: error.message,
    });
  }
});

// GET ALL DEVICES
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SEARCH DEVICES
// IMPORTANT: this must be before /type/:type
router.get("/search/:keyword", async (req, res) => {
  try {
    const keyword = req.params.keyword.trim();

    const conditions = [
      { EmployeeName: { $regex: keyword, $options: "i" } },
      { SerialNumber: { $regex: keyword, $options: "i" } },
      { AssetCode: { $regex: keyword, $options: "i" } },
      { DeviceName: { $regex: keyword, $options: "i" } },
    ];

    if (!isNaN(keyword)) {
      conditions.push({
        EPFNumber: Number(keyword),
      });
    }

    const devices = await Device.find({
      $or: conditions,
    }).sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    res.status(500).json({
      message: "Search failed",
      error: error.message,
    });
  }
});

// GET DEVICES BY TYPE
router.get("/type/:type", async (req, res) => {
  try {
    const devices = await Device.find({
      DeviceType: req.params.type,
    }).sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE DEVICE
router.put("/:id", async (req, res) => {
  try {
    const updatedDevice = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedDevice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE DEVICE
router.delete("/:id", async (req, res) => {
  try {
    await Device.findByIdAndDelete(req.params.id);
    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;