const express = require("express");
const { Package } = require("../models");

const router = express.Router();

// Get all packages
router.get("/", async (req, res) => {
  try {
    const packages = await Package.findAll();
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving packages" });
  }
});

// Update a package
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { price, duration, description } = req.body;

    // Validate input
    if (!price) {
      return res.status(400).json({ message: "Missing price information" });
    }

    const [updated] = await Package.update(
      {
        price: parseFloat(price),
        ...(duration && { duration: parseInt(duration) }),
        ...(description && { description }),
      },
      {
        where: { id },
        returning: true,
      }
    );

    if (updated === 0) {
      return res.status(404).json({ message: "Package not found" });
    }

    const updatedPackage = await Package.findByPk(id);
    res.json(updatedPackage);
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(400).json({
      message: "Failed to update price",
      error: error.message,
    });
  }
});

// Create a new package
router.post("/", async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;

    // Validate input
    if (!name || !price || !duration) {
      return res.status(400).json({ message: "Missing required information" });
    }

    const newPackage = await Package.create({
      name,
      price: parseFloat(price),
      duration: parseInt(duration),
      description,
    });

    res.status(201).json(newPackage);
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(400).json({
      message: "Failed to create package",
      error: error.message,
    });
  }
});

// Delete a package
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Package.destroy({
      where: { id },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("Error deleting package:", error);
    res.status(400).json({
      message: "Failed to delete package",
      error: error.message,
    });
  }
});

module.exports = router;
