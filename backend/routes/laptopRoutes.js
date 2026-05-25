const express = require("express");
const router = express.Router();

const Laptop = require("../models/Laptop");


// GET ALL LAPTOPS
router.get("/", async (req, res) => {
  try {
    const laptops = await Laptop.find();
    res.json(laptops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ADD NEW LAPTOP
router.post("/", async (req, res) => {
  try {
    const newLaptop = new Laptop(req.body);
    await newLaptop.save();

    res.status(201).json(newLaptop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// UPDATE LAPTOP
router.put("/:id", async (req, res) => {
  try {
    const updatedLaptop = await Laptop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedLaptop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// DELETE LAPTOP
router.delete("/:id", async (req, res) => {
  try {
    await Laptop.findByIdAndDelete(req.params.id);

    res.json({ message: "Laptop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// SEARCH BY EPF NUMBER
router.get("/search/:epfNumber", async (req, res) => {
  try {
    const laptops = await Laptop.find({
      epfNumber: req.params.epfNumber,
    });

    res.json(laptops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;