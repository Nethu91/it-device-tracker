const express = require("express");
const router = express.Router();

const Device = require("../models/Device");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/* =====================================================
   EXISTING ROUTES (UNCHANGED - KEEP YOUR OLD CODE HERE)
   👉 your existing CRUD routes stay as they are
===================================================== */



/* =====================================================
   🆕 DISPOSE DEVICE (NEW FEATURE - SAFE ADDITION)
===================================================== */
router.post("/dispose/:id", protect, adminOnly, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // ONLY UPDATE DISPOSAL FIELDS (DO NOT TOUCH OLD DATA)
    device.isDisposed = true;
    device.disposedAt = new Date();
    device.disposalReason =
      req.body.reason || "5 Year Lifecycle Completed";

    device.expiryStatus = "EXPIRED_5Y";

    await device.save();

    res.json({
      message: "Device moved to disposal successfully",
      success: true,
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
   🆕 GET DISPOSED DEVICES (NEW FEATURE)
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
   🆕 OPTIONAL: MARK NEAR EXPIRY (SAFE ADD - NO BREAK)
   (you can call from cron job)
===================================================== */
router.post("/check-expiry", protect, adminOnly, async (req, res) => {
  try {
    const devices = await Device.find({ isDisposed: false });

    const now = new Date();

    for (let d of devices) {
      if (!d.PurchaseDate) continue;

      const years =
        (now - new Date(d.PurchaseDate)) /
        (1000 * 60 * 60 * 24 * 365);

      if (years >= 4 && years < 4.5) {
        d.expiryStatus = "NEAR_EXPIRY";
      }

      if (years >= 5) {
        d.expiryStatus = "EXPIRED_5Y";
      }

      await d.save();
    }

    res.json({ message: "Expiry check completed" });
  } catch (error) {
    res.status(500).json({
      message: "Expiry check failed",
      error: error.message,
    });
  }
});



module.exports = router;