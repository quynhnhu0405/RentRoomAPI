const express = require("express");
const { Utilities } = require("../models");

const router = express.Router();

// Add a utility
router.post("/", async (req, res) => {
  try {
    const newUtility = await Utilities.create(req.body);
    res.status(201).json(newUtility);
  } catch (error) {
    res.status(500).json({ error: "Error adding utility" });
  }
});

// Get all utilities
router.get("/", async (req, res) => {
  try {
    const utilities = await Utilities.findAll();
    res.status(200).json(utilities);
  } catch (error) {
    res.status(500).json({ error: "Error finding utilities" });
  }
});

// Update a utility
router.put("/:id", async (req, res) => {
  try {
    const [updated] = await Utilities.update(req.body, {
      where: { id: req.params.id },
    });

    if (updated === 0) {
      return res.status(404).json({ error: "Utility not found" });
    }

    const updatedUtility = await Utilities.findByPk(req.params.id);
    res.json(updatedUtility);
  } catch (error) {
    res.status(500).json({ error: "Error updating utility" });
  }
});

// Delete a utility
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Utilities.destroy({
      where: { id: req.params.id },
    });

    if (deleted === 0) {
      return res.status(404).json({ error: "Utility not found" });
    }

    res.json({ message: "Utility deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting utility" });
  }
});

module.exports = router;
