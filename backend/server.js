require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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
   MongoDB Atlas Connection
================================ */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
  });

/* ================================
   Routes
================================ */

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/devices", require("./routes/deviceRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));

// New dynamic GUI interface routes
app.use("/api/device-templates", require("./routes/templateRoutes"));
app.use("/api/custom-devices", require("./routes/customDeviceRoutes"));

/* ================================
   Default Route
================================ */

app.get("/", (req, res) => {
  res.send("IT Device Tracker API Running...");
});

/* ================================
   404 Handler
================================ */

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
  });
});

/* ================================
   Server Start
================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});