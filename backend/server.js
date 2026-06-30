require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");

const app = express();

/* ================================
   CORS
================================ */

const allowedOrigins = [
  "http://localhost:3000",
  "https://it-device-tracker.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

/* ================================
   Body Parsers
================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
   Static Files
================================ */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================================
   MongoDB Atlas Connection
================================ */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

/* ================================
   Health Check
================================ */

app.get("/", (req, res) => {
  res.json({
    message: "IT Device Tracker API Running",
    status:  "ok",
    time:    new Date().toISOString(),
  });
});

/* ================================
   API Routes
================================ */

app.use("/api/auth",           require("./routes/authRoutes"));
app.use("/api/devices",        require("./routes/deviceRoutes"));
app.use("/api/employees",      require("./routes/employeeRoutes"));
app.use("/api/device-templates", require("./routes/templateRoutes"));
app.use("/api/custom-devices", require("./routes/customDeviceRoutes"));

/* ================================
   404 Handler  ← must be LAST
================================ */

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
    path:    req.originalUrl,
  });
});

/* ================================
   Global Error Handler
================================ */

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

/* ================================
   Start Server
================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});