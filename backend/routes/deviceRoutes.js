const express = require("express");
const router = express.Router();

const Device   = require("../models/Device");
const Employee = require("../models/Employee");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/* =====================================================
   GET ALL DEVICES
===================================================== */
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;
    let query;

    // ADMIN → සියලුම devices
    if (user.role === "admin") {
      query = { isDisposed: { $ne: true } };
    }
    // USER → Employee record එකෙන් EPFNumber හොයලා filter කරනවා
    else {
      const employeeId = user.employeeId || user.id || "";
      const employee   = await Employee.findById(employeeId);
      const epfNumber  = employee?.EPFNumber || employee?.epfNumber || "";

      query = {
        isDisposed: { $ne: true },
        EPFNumber:  epfNumber,
      };
    }

    const devices = await Device.find(query).sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    console.error("Fetch devices error:", error);
    res.status(500).json({
      message: "Failed to fetch devices",
      error: error.message,
    });
  }
});

/* =====================================================
   CREATE DEVICE
===================================================== */
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    console.error("Create device error:", error);
    res.status(500).json({
      message: "Failed to create device",
      error: error.message,
    });
  }
});

/* =====================================================
   DISPOSE DEVICE
===================================================== */
router.post("/dispose/:id", protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    if (device.isDisposed) {
      return res.status(400).json({ message: "Device already disposed" });
    }

    device.isDisposed     = true;
    device.disposedAt     = new Date();
    device.disposalReason = reason || "5 Year Lifecycle Completed";
    device.expiryStatus   = "EXPIRED_5Y";
    device.Status         = "Retired";

    await device.save();
    res.json({ message: "Device disposed successfully", success: true, device });
  } catch (error) {
    console.error("Dispose error:", error);
    res.status(500).json({ message: "Dispose failed", error: error.message });
  }
});

/* =====================================================
   GET DISPOSED DEVICES (ADMIN ONLY)
===================================================== */
router.get("/disposed", protect, adminOnly, async (req, res) => {
  try {
    const devices = await Device.find({ isDisposed: true }).sort({ disposedAt: -1 });
    res.json(devices);
  } catch (error) {
    console.error("Fetch disposed error:", error);
    res.status(500).json({
      message: "Failed to fetch disposed devices",
      error: error.message,
    });
  }
});

/* =====================================================
   RESTORE DEVICE
===================================================== */
router.post("/restore/:id", protect, adminOnly, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    device.isDisposed     = false;
    device.disposedAt     = null;
    device.disposalReason = "";
    device.expiryStatus   = "ACTIVE";
    device.Status         = "Available";

    await device.save();
    res.json({ message: "Device restored successfully", success: true });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({ message: "Restore failed", error: error.message });
  }
});

/* =====================================================
   LIFECYCLE / EXPIRY CHECK
===================================================== */
router.post("/check-expiry", protect, adminOnly, async (req, res) => {
  try {
    const devices = await Device.find({ isDisposed: { $ne: true } });
    const now = new Date();
    let updated = 0;

    for (const d of devices) {
      if (!d.PurchaseDate) continue;

      const years =
        (now - new Date(d.PurchaseDate)) / (1000 * 60 * 60 * 24 * 365);

      if (years >= 5) {
        d.expiryStatus = "EXPIRED_5Y";
        updated++;
      } else if (years >= 4) {
        d.expiryStatus = "NEAR_EXPIRY";
        updated++;
      }

      await d.save();
    }

    res.json({ message: "Expiry check completed", updated });
  } catch (error) {
    console.error("Expiry check failed:", error);
    res.status(500).json({ message: "Expiry check failed", error: error.message });
  }
});

/* =====================================================
   UPDATE DEVICE
===================================================== */
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  } catch (error) {
    console.error("Update device error:", error);
    res.status(500).json({ message: "Failed to update device", error: error.message });
  }
});

/* =====================================================
   DELETE DEVICE
===================================================== */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("Delete device error:", error);
    res.status(500).json({ message: "Failed to delete device", error: error.message });
  }
});

/* =====================================================
   GET SINGLE DEVICE
===================================================== */
router.get("/:id", protect, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  } catch (error) {
    console.error("Get device error:", error);
    res.status(500).json({ message: "Failed to get device", error: error.message });
  }
});

module.exports = router;