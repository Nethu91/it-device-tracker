const express = require("express");
const router = express.Router();

const Device = require("../models/Device");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/* =====================================================
   🟢 GET ALL DEVICES (ROLE BASED FIX - NEW)
===================================================== */
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;

    let query = { isDisposed: false };

    // ADMIN → sees all devices
    if (user.role === "admin") {
      query = { isDisposed: false };
    }

    // USER → only assigned devices
    else {
      query = {
        isDisposed: false,
        EPFNumber: user.epfNumber || user.id,
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
   🔥 DISPOSE DEVICE (ENTERPRISE FIXED VERSION)
===================================================== */
router.post("/dispose/:id", protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;

    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    if (device.isDisposed) {
      return res.status(400).json({
        message: "Device already disposed",
      });
    }

    device.isDisposed = true;
    device.disposedAt = new Date();
    device.disposalReason = reason || "5 Year Lifecycle Completed";
    device.expiryStatus = "EXPIRED_5Y";
    device.Status = "Retired";

    await device.save();

    res.json({
      message: "Device disposed successfully",
      success: true,
      device,
    });
  } catch (error) {
    console.error("Dispose error:", error);
    res.status(500).json({
      message: "Dispose failed",
      error: error.message,
    });
  }
});

/* =====================================================
   🔥 GET DISPOSED DEVICES (ADMIN ONLY)
===================================================== */
router.get("/disposed", protect, adminOnly, async (req, res) => {
  try {
    const devices = await Device.find({
      isDisposed: true,
    }).sort({ disposedAt: -1 });

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
   🔥 RESTORE DEVICE (OPTIONAL FEATURE)
===================================================== */
router.post("/restore/:id", protect, adminOnly, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    device.isDisposed = false;
    device.disposedAt = null;
    device.disposalReason = "";
    device.expiryStatus = "ACTIVE";
    device.Status = "Available";

    await device.save();

    res.json({
      message: "Device restored successfully",
      success: true,
    });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({
      message: "Restore failed",
      error: error.message,
    });
  }
});

/* =====================================================
   🔥 LIFECYCLE CHECK (CRON SUPPORT SAFE)
===================================================== */
router.post("/check-expiry", protect, adminOnly, async (req, res) => {
  try {
    const devices = await Device.find({
      isDisposed: false,
    });

    const now = new Date();
    let updated = 0;

    for (const d of devices) {
      if (!d.PurchaseDate) continue;

      const years =
        (now - new Date(d.PurchaseDate)) /
        (1000 * 60 * 60 * 24 * 365);

      if (years >= 5) {
        d.expiryStatus = "EXPIRED_5Y";
        updated++;
      } else if (years >= 4) {
        d.expiryStatus = "NEAR_EXPIRY";
        updated++;
      }

      await d.save();
    }

    res.json({
      message: "Expiry check completed",
      updated,
    });
  } catch (error) {
    console.error("Expiry check failed:", error);
    res.status(500).json({
      message: "Expiry check failed",
      error: error.message,
    });
  }
});

module.exports = router;