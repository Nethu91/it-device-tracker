require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const cron = require("node-cron");

// Jobs (NEW)
const runDeviceNotifications = require("./jobs/deviceNotificationJob");

const app = express();

/* ================================
   Middleware
================================ */

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://it-device-tracker.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================================
   MongoDB Connection
================================ */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

/* ================================
   ROUTES
================================ */

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/devices", require("./routes/deviceRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));

app.use("/api/device-templates", require("./routes/templateRoutes"));
app.use("/api/custom-devices", require("./routes/customDeviceRoutes"));

/* ================================
   HEALTH CHECK
================================ */

app.get("/", (req, res) => {
  res.send("IT Device Tracker API Running...");
});

/* ================================
   DEVICE LIFECYCLE JOB (NEW)
   Runs every day at 12:00 AM
================================ */

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running device lifecycle notification job...");

    await runDeviceNotifications();

    console.log("Device lifecycle job completed");
  } catch (err) {
    console.error("Lifecycle job error:", err.message);
  }
});

/* ================================
   404 HANDLER
================================ */

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
  });
});

/* ================================
   START SERVER
================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});