const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
  mongoose.connect("mongodb://127.0.0.1:27017/it_device_tracker")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// ROUTES
const authRoutes = require("./routes/authRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const fingerprintRoutes = require("./routes/fingerprintRoutes");
const laptopRoutes = require("./routes/laptopRoutes");
const mobilePhoneRoutes = require("./routes/mobilePhoneRoutes");

// USE ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/fingerprint-machines", fingerprintRoutes);
app.use("/api/laptops", laptopRoutes);
app.use("/api/mobile-phones", mobilePhoneRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("API Running...");
});

// PORT
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});