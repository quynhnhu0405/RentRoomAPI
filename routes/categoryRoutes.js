const express = require("express");
const Category = require("../models/Category");
const Post = require("../models/Post");
const router = express.Router();
const Payment = require("../models/Payment");

router.get("/", async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.find({});
    const revenueData = await Payment.aggregate([
      {
        $lookup: {
          from: "posts", 
          localField: "PostId", 
          foreignField: "_id", 
          as: "postData",
        },
      },
      {
        $unwind: "$postData", 
      },
      {
        $group: {
          _id: "$postData.category.id",
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$total", 0] },
          },
        },
      },
    ]);
    const postCountData = await Post.aggregate([
      {
        $group: {
          _id: "$category.id",
          postCount: { $sum: 1 },
        },
      },
    ]);

    // Create maps for revenue and post count by category id
    const revenueMap = {};
    revenueData.forEach((item) => {
      revenueMap[item._id.toString()] = item.totalRevenue;
    });

    const postCountMap = {};
    postCountData.forEach((item) => {
      postCountMap[item._id.toString()] = item.postCount;
    });
    const result = categories.map((category) => ({
      _id: category._id,
      name: category.name,
      createAt: category.createAt,
      totalRevenue: revenueMap[category._id.toString()] || 0, 
      postCount: postCountMap[category._id.toString()] || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
