const express = require("express");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Post = require("../models/Post");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// 🟢 Lấy danh sách users + thống kê bài viết & doanh thu
router.get("/", async (req, res) => {
    try {
        const users = await User.find().lean();
        const userIds = users.map(user => user._id);

        const postCounts = await Post.aggregate([
            { $match: { landlordId: { $in: userIds } } },
            { $group: { _id: "$landlordId", count: { $sum: 1 } } }
        ]);

        const payments = await Payment.aggregate([
            { $match: { landlordId: { $in: userIds }, status: "completed" } },
            { $group: { _id: "$landlordId", totalRevenue: { $sum: "$total" } } }
        ]);

        // Gán thống kê vào user
        const usersWithStats = users.map(user => ({
            ...user,
            postCount: postCounts.find(p => p._id.toString() === user._id.toString())?.count || 0,
            revenue: payments.find(p => p._id.toString() === user._id.toString())?.totalRevenue || 0
        }));

        res.status(200).json(usersWithStats);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách user:", error);
        res.status(500).json({ error: "Lỗi khi lấy danh sách user" });
    }
});

// 🟢 Lấy thống kê của một user theo ID
router.get("/:id/stats", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID không hợp lệ" });
        }

        const userId = new mongoose.Types.ObjectId(id);

        const postCountResult = await Post.aggregate([
            { $match: { landlordId: userId } },
            { $count: "total" }
        ]);
        const postCount = postCountResult.length > 0 ? postCountResult[0].total : 0;

        const payments = await Payment.aggregate([
            { $match: { landlordId: userId, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const revenue = payments.length > 0 ? payments[0].total : 0;

        res.status(200).json({ postCount, revenue });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê user:", error);
        res.status(500).json({ error: "Lỗi khi lấy thống kê user" });
    }
});

// 🟢 Lấy thông tin một user theo ID
router.get("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID không hợp lệ" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: "User không tồn tại" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { status },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
});

// Xóa tài khoản
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tài khoản' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'Số điện thoại đã được đăng ký' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      role: role || 'user',
      status: 'active'
    });
    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Lỗi khi tạo tài khoản' });
  }
});

module.exports = router;
