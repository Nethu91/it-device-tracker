const express = require("express");

const router = express.Router();

const FingerprintMachine =
  require("../models/FingerprintMachine");


// TEST ROUTE
router.get("/test", (req, res) => {

  res.json({
    message: "Fingerprint route working",
  });

});


// GET ALL FINGERPRINTS
router.get("/", async (req, res) => {

  try {

    console.log(
      "Fetching fingerprint machines..."
    );

    const machines =
      await FingerprintMachine.find().lean();

    console.log(machines);

    res.json(machines);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });

  }

});


// ADD FINGERPRINT
router.post("/", async (req, res) => {

  try {

    const newMachine =
      new FingerprintMachine(req.body);

    const savedMachine =
      await newMachine.save();

    res.json(savedMachine);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });

  }

});


module.exports = router;