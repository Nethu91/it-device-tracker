const Device = require("../models/Device");
const sendMail = require("../utils/mailer");

/* =========================================
   DEVICE LIFECYCLE CHECK JOB (DAILY)
========================================= */

const runDeviceNotifications = async () => {
  try {
    const devices = await Device.find({
      isDisposed: false, // ❗ ignore disposed devices
    });

    const now = new Date();

    for (let d of devices) {
      if (!d.PurchaseDate) continue;

      const purchaseDate = new Date(d.PurchaseDate);

      const diffYears =
        (now - purchaseDate) /
        (1000 * 60 * 60 * 24 * 365);

      const adminEmail = process.env.ADMIN_EMAIL;

      /* =====================================
         6 MONTH WARNING (4.5 YEARS)
      ===================================== */
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
          This device will complete its 5-year lifecycle in approximately 6 months.
          </p>

          <p>Please plan replacement or disposal process.</p>
          `
        );

        d.expiryNotified6m = true;
      }

      /* =====================================
         3 MONTH WARNING (4.75 YEARS)
      ===================================== */
      if (
        diffYears >= 4.75 &&
        diffYears < 5 &&
        !d.expiryNotified3m
      ) {
        await sendMail(
          adminEmail,
          "🚨 Urgent Device Replacement (3 Months Left)",
          `
          <h2>Urgent Device Replacement</h2>

          <p><b>Device:</b> ${d.DeviceName || d.DeviceType}</p>
          <p><b>Employee:</b> ${d.EmployeeName}</p>
          <p><b>Department:</b> ${d.Department}</p>

          <p style="color:red;">
          This device will complete lifecycle in less than 3 months.
          Immediate replacement required.
          </p>
          `
        );

        d.expiryNotified3m = true;
      }

      /* =====================================
         STATUS UPDATE (NO EMAIL)
      ===================================== */
      if (diffYears >= 4 && diffYears < 4.5) {
        d.expiryStatus = "NEAR_EXPIRY";
      }

      if (diffYears >= 5) {
        d.expiryStatus = "EXPIRED_5Y";
      }

      await d.save();
    }

    console.log("Device lifecycle job completed successfully");
  } catch (error) {
    console.error("Device expiry job error:", error.message);
  }
};

module.exports = runDeviceNotifications;