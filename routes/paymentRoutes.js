const express = require("express");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Post = require("../models/Post");
const Package = require("../models/Package");
const { auth, authAdmin } = require("../middleware/auth");
const moment = require("moment");

const router = express.Router();

// API Tạo thanh toán mới
router.post("/", async (req, res) => {
  try {
    const { postId, packageId, duration } = req.body;

    // Kiểm tra post tồn tại và thuộc về user
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    if (post.landlordId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thanh toán cho bài đăng này" });
    }

    // Tính toán giá tiền dựa trên thời hạn
    let total = 0;
    let durationInDays = 0;

    if (duration === "day") {
      total = packageInfo.priceday;
      durationInDays = 1;
    } else if (duration === "week") {
      total = packageInfo.priceweek;
      durationInDays = 7;
    } else if (duration === "month") {
      total = packageInfo.pricemonth;
      durationInDays = 30;
    } else {
      return res
        .status(400)
        .json({
          message: "Thời hạn không hợp lệ. Vui lòng chọn day, week hoặc month",
        });
    }

    // Tạo thanh toán mới
    const newPayment = new Payment({
      PostId: postId,
      landlordId: req.user._id,
      total,
      status: "pending",
    });

    await newPayment.save();

    // Tính ngày hết hạn
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationInDays);

    // Cập nhật post với gói và ngày hết hạn
    await Post.findByIdAndUpdate(postId, {
      $set: { package: [packageId], expiryDate },
    });

    res.status(201).json({
      payment: newPayment,
      expiryDate,
      message: "Thanh toán đã được tạo, vui lòng hoàn tất thanh toán",
    });
  } catch (error) {
    console.error("Lỗi khi tạo thanh toán:", error);
    res.status(500).json({ error: "Lỗi khi tạo thanh toán" });
  }
});

// API Hoàn tất thanh toán
router.patch("/:id/complete", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra payment tồn tại
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thanh toán" });
    }

    // Kiểm tra người dùng có quyền cập nhật payment này không
    if (payment.landlordId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền cập nhật thanh toán này" });
    }

    // Cập nhật trạng thái thanh toán
    payment.status = "completed";
    await payment.save();

    // Cập nhật trạng thái bài đăng nếu chưa available
    const post = await Post.findById(payment.PostId);
    if (post && post.status !== "available") {
      post.status = "waiting"; // Chuyển về trạng thái chờ admin duyệt
      await post.save();
    }

    res.status(200).json({
      payment,
      message: "Thanh toán hoàn tất, bài đăng của bạn sẽ được duyệt sớm",
    });
  } catch (error) {
    console.error("Lỗi khi hoàn tất thanh toán:", error);
    res.status(500).json({ error: "Lỗi khi hoàn tất thanh toán" });
  }
});
router.get('/', async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate('PostId', 'title')  // Populate PostId to get post title
        .populate('landlordId', 'name')  // Populate landlordId to get name
        .exec();
      
      res.status(200).json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });
// API Lấy lịch sử thanh toán của người dùng
router.get("/my-payments", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ landlordId: req.user._id })
      .populate({
        path: "PostId",
        select: "title images",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử thanh toán:", error);
    res.status(500).json({ error: "Lỗi khi lấy lịch sử thanh toán" });
  }
});
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate the status
  if (!["pending", "completed", "failed"].includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }
  try {
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Thanh toán không tìm thấy" });
    }

    payment.status = status;
    await payment.save();

    res.status(200).json({ message: `Đã cập nhật trạng thái thành ${status}` });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Cập nhật trạng thái thất bại" });
  }
});

router.get("/completed-total", async (req, res) => {
  try {
    const result = await Payment.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    const total = result.length > 0 ? result[0].total : 0;
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy doanh thu 6 tháng gần nhất
router.get("/monthly-revenue", async (req, res) => {
  try {
    // Tạo mảng 6 tháng gần nhất
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = moment().subtract(i, "months");
      months.push({
        year: date.year(),
        month: date.month() + 1, // moment.js month is 0-based
        name: date.format("MM/YYYY"),
      });
    }

    // Truy vấn doanh thu từ database
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

        const result = await Payment.aggregate([
          {
            $match: {
              status: "completed", // Chỉ lấy các giao dịch đã hoàn thành
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" }, // Sử dụng trường 'total' thay vì 'amount'
            },
          },
        ]);

        return {
          month: m.name,
          revenue: result.length > 0 ? result[0].total : 0,
        };
      })
    );

    res.json(revenueData);
  } catch (err) {
    console.error("Error fetching monthly revenue:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu doanh thu" });
  }
});
//Lấy payment theo userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({ landlordId: userId })
      .populate({
        path: "PostId",
        select: "title",
      });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: "No payments found for this user" });
    }

    res.json(payments);
  } catch (error) {
    console.error("Error getting payments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
