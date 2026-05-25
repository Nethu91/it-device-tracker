const express = require("express");
const router = express.Router();

const Laptop = require("../models/Laptop");
const MobilePhone = require("../models/MobilePhone");
const FingerprintMachine = require("../models/FingerprintMachine");

router.get("/:epf", async (req, res) => {

  try {

    const epf = req.params.epf;

    const laptops = await Laptop.find({
      epfNumber: epf,
    });

    const mobilePhones =
      await MobilePhone.find({
        epfNumber: epf,
      });

    const fingerprintMachines =
      await FingerprintMachine.find({
        assetCode: epf,
      });

    res.json({
      laptops,
      mobilePhones,
      fingerprintMachines,
    });

  } catch (error) {

    res.status(500).json(error);

  }

});

module.exports = router;