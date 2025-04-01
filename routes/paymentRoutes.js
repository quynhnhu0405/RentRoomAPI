const express = require("express");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Post = require("../models/Post");
const Package = require("../models/Package");
const { auth } = require("../middleware/auth");

const router = express.Router();

// API Tạo thanh toán mới
router.post("/", auth, async (req, res) => {
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

    // Lấy thông tin gói
    const packageInfo = await Package.findById(packageId);
    if (!packageInfo) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
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

module.exports = router;
