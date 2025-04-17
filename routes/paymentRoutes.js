const express = require("express");
const { Payment, Post, Package, User } = require("../models");
const { auth, authAdmin } = require("../middleware/auth");
const moment = require("moment");
const { Op } = require("sequelize");
const { sequelize } = require("../config/db");

const router = express.Router();

// Create a new payment
router.post("/", auth, async (req, res) => {
  try {
    const { postId, amount, status } = req.body;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Verify user is the owner of the post
    const userId = req.user.id;
    if (post.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You don't have permission to pay for this post" });
    }

    // Calculate end date based on package duration
    const packageInfo = await Package.findByPk(req.body.packageId);
    if (!packageInfo) {
      return res.status(404).json({ message: "Package not found" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageInfo.duration);

    // Create payment with provided data
    const newPayment = await Payment.create({
      postId,
      userId,
      packageId: req.body.packageId,
      amount,
      status: status || "completed", // Default to completed if not provided
      startDate,
      endDate,
    });

    // Update post status if payment is completed
    if (newPayment.status === "completed" && post.status === "pending") {
      await Post.update(
        { status: "active", expiryDate: endDate },
        { where: { id: postId } }
      );
    }

    res.status(201).json({
      payment: newPayment,
      message: "Payment created successfully",
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res
      .status(500)
      .json({ error: "Error creating payment", details: error.message });
  }
});

// Complete a payment
router.patch("/:id/complete", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if payment exists
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user has permission to update this payment
    if (payment.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You don't have permission to update this payment" });
    }

    // Update payment status
    await Payment.update({ status: "completed" }, { where: { id } });

    // Update post status if not active
    const post = await Post.findByPk(payment.postId);
    if (post && post.status !== "active") {
      await Post.update(
        { status: "active" },
        { where: { id: payment.postId } }
      );
    }

    const updatedPayment = await Payment.findByPk(id);
    res.status(200).json({
      payment: updatedPayment,
      message: "Payment completed, your post will be approved soon",
    });
  } catch (error) {
    console.error("Error completing payment:", error);
    res.status(500).json({ error: "Error completing payment" });
  }
});

// Get all payments (admin)
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        { model: Post, attributes: ["title"] },
        { model: User, attributes: ["name"] },
      ],
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

// Get user's payment history
router.get("/my-payments", auth, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Post, attributes: ["title"] },
        { model: Package, attributes: ["name", "price", "duration"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error getting payment history:", error);
    res.status(500).json({ error: "Error getting payment history" });
  }
});

// Update payment status
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate the status
  if (!["pending", "completed", "failed", "refunded"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const [updated] = await Payment.update({ status }, { where: { id } });

    if (updated === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ message: `Status updated to ${status}` });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// Get total amount of completed payments
router.get("/completed-total", async (req, res) => {
  try {
    const result = await Payment.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
      where: { status: "completed" },
      raw: true,
    });

    const total = result.total || 0;
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get monthly revenue for the last 6 months
router.get("/monthly-revenue", async (req, res) => {
  try {
    // Create array of last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = moment().subtract(i, "months");
      months.push({
        year: date.year(),
        month: date.month() + 1, // moment.js month is 0-based
        name: date.format("MM/YYYY"),
      });
    }

    // Query revenue from database
    const revenueData = await Promise.all(
      months.map(async (m) => {
        const startDate = moment()
          .year(m.year)
          .month(m.month - 1)
          .startOf("month")
          .toDate();
        const endDate = moment()
          .year(m.year)
          .month(m.month - 1)
          .endOf("month")
          .toDate();

        const result = await Payment.findOne({
          attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
          where: {
            status: "completed",
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          },
          raw: true,
        });

        return {
          month: m.name,
          revenue: result.total || 0,
        };
      })
    );

    res.json(revenueData);
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({ message: "Failed to fetch monthly revenue" });
  }
});

module.exports = router;
