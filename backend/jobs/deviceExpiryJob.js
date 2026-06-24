const Device = require("../models/Device");

// ⚠️ SAFE MAILER IMPORT (won’t crash if missing)
let sendMail;
try {
  sendMail = require("../utils/mailer");
} catch (err) {
  sendMail = async () => {
    console.log("📧 Mailer not configured - skipping email");
  };
}

/* ================================
   DEVICE LIFECYCLE JOB (OPTIMIZED)
================================ */

const runDeviceNotifications = async () => {
  try {
    const devices = await Device.find({ isDisposed: false });

    const now = new Date();
    const adminEmail = process.env.ADMIN_EMAIL;

    let bulkOps = [];

    for (let d of devices) {
      if (!d.PurchaseDate) continue;

      const purchaseDate = new Date(d.PurchaseDate);

      const diffYears =
        (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365);

      let updateFields = {};

      /* =========================
         6 MONTH WARNING (4.5Y)
      ========================= */
      if (
        diffYears >= 4.5 &&
        diffYears < 4.75 &&
        !d.expiryNotified6m
      ) {
        await sendMail(
          adminEmail,
          "⚠ Device Near Replacement (6 Months Left)",
          `
          <h2>Device Lifecycle Warning</h2>
          <p><b>Device:</b> ${d.DeviceName || d.DeviceType}</p>
          <p><b>Employee:</b> ${d.EmployeeName}</p>
          <p><b>Department:</b> ${d.Department}</p>
          <p style="color:orange;">
          Device will expire in ~6 months.
          </p>
          `
        );

        updateFields.expiryNotified6m = true;
      }

      /* =========================
         3 MONTH WARNING (4.75Y)
      ========================= */
      if (
        diffYears >= 4.75 &&
        diffYears < 5 &&
        !d.expiryNotified3m
      ) {
        await sendMail(
          adminEmail,
          "🚨 Urgent Device Replacement (3 Months Left)",
          `
          <h2>Urgent Action Required</h2>
          <p><b>Device:</b> ${d.DeviceName || d.DeviceType}</p>
          <p><b>Employee:</b> ${d.EmployeeName}</p>
          <p style="color:red;">
          Device will expire in less than 3 months.
          </p>
          `
        );

        updateFields.expiryNotified3m = true;
      }

      /* =========================
         STATUS UPDATE
      ========================= */

      if (diffYears >= 4 && diffYears < 5) {
        updateFields.expiryStatus = "NEAR_EXPIRY";
      }

      if (diffYears >= 5) {
        updateFields.expiryStatus = "EXPIRED_5Y";
      }

      /* =========================
         BULK UPDATE PREP
      ========================= */

      if (Object.keys(updateFields).length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: d._id },
            update: { $set: updateFields },
          },
        });
      }
    }

    /* =========================
       BULK WRITE
    ========================= */

    if (bulkOps.length > 0) {
      await Device.bulkWrite(bulkOps);
    }

    console.log("✅ Device lifecycle job completed");
  } catch (err) {
    console.error("❌ Device lifecycle job error:", err.message);
  }
};

module.exports = runDeviceNotifications;