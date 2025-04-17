const express = require("express");
const { Category, Post, Payment } = require("../models");
const router = express.Router();
const { Op } = require("sequelize");
const { sequelize } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.findAll();

    // Get revenue data by category using Sequelize
    const revenueData = await Payment.findAll({
      attributes: [
        [sequelize.col("Post.categoryId"), "categoryId"],
        [sequelize.fn("SUM", sequelize.col("amount")), "totalRevenue"],
      ],
      include: [
        {
          model: Post,
          attributes: [],
        },
      ],
      where: {
        status: "completed",
      },
      group: ["Post.categoryId"],
      raw: true,
    });

    // Get post count by category
    const postCountData = await Post.findAll({
      attributes: [
        "categoryId",
        [sequelize.fn("COUNT", sequelize.col("id")), "postCount"],
      ],
      group: ["categoryId"],
      raw: true,
    });

    // Create maps for revenue and post count by category id
    const revenueMap = {};
    revenueData.forEach((item) => {
      revenueMap[item.categoryId] = parseFloat(item.totalRevenue) || 0;
    });

    const postCountMap = {};
    postCountData.forEach((item) => {
      postCountMap[item.categoryId] = parseInt(item.postCount) || 0;
    });

    // Map the data to the response format
    const result = categories.map((category) => ({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      totalRevenue: revenueMap[category.id] || 0,
      postCount: postCountMap[category.id] || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new category
router.post("/", async (req, res) => {
  try {
    const newCategory = await Category.create(req.body);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Error creating category" });
  }
});

// Update a category
router.put("/:id", async (req, res) => {
  try {
    const [updated] = await Category.update(req.body, {
      where: { id: req.params.id },
    });

    if (updated === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await Category.findByPk(req.params.id);
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating category" });
  }
});

// Delete a category
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Category.destroy({
      where: { id: req.params.id },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category" });
  }
});

module.exports = router;
