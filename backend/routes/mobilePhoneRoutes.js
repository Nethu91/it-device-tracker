const express = require("express");

const router = express.Router();

const FingerprintMachine =
  require("../models/FingerprintMachine");

// GET ALL
router.get("/", async (req, res) => {

  try {

    const machines =
      await FingerprintMachine.find();

    res.json(machines);

  } catch (error) {

    res.status(500).json(error);

  }

});

// ADD
router.post("/", async (req, res) => {

  try {

    const newMachine =
      new FingerprintMachine(req.body);

    const savedMachine =
      await newMachine.save();

    res.json(savedMachine);

  } catch (error) {

    res.status(500).json(error);

  }

});

module.exports = router;