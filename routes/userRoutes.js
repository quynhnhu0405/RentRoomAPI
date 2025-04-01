const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// API đăng ký
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Kiểm tra xem số điện thoại đã tồn tại chưa
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã được sử dụng" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    // Tạo token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ error: "Lỗi khi đăng ký tài khoản" });
  }
});

// API đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Kiểm tra user tồn tại
    const user = await User.findOne({ phone });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status !== "active") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
    }

    // Tạo token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ error: "Lỗi khi đăng nhập" });
  }
});

// API quên mật khẩu
router.post("/forgot-password", async (req, res) => {
  try {
    const { phone } = req.body;

    // Kiểm tra user tồn tại
    const user = await User.findOne({ phone });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với số điện thoại này" });
    }

    // Trong thực tế, gửi mã xác nhận qua SMS hoặc email
    // Ở đây tạm thời trả về thành công

    res
      .status(200)
      .json({ message: "Vui lòng kiểm tra tin nhắn để đặt lại mật khẩu" });
  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error);
    res.status(500).json({ error: "Lỗi khi xử lý yêu cầu" });
  }
});

// API Thêm User (chỉ admin)
router.post("/", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi thêm user" });
  }
});

// API Lấy danh sách users (chỉ admin)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi tìm user" });
  }
});

// API Lấy thông tin user theo ID
router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
