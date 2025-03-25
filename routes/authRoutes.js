// routes/auth.js
const express = require("express");
const router = express.Router();
const {
  isValidPhoneNumber,
  isValidName,
  isValidPassword,
} = require("../utils/validate");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "nhuancutcho";

// Route đăng ký người dùng
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Kiểm tra định dạng
    if (!isValidName(name)) {
      return res.status(400).json({
        message: "Tên không hợp lệ. Chỉ được chứa chữ cái và dấu cách.",
      });
    }
    if (!isValidPhoneNumber(phone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Mật khẩu không hợp lệ." });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Số điện thoại đã được sử dụng." });
    }

    // Hash mật khẩu trước khi lưu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu vào DB
    const newUser = new User({ name, phone, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Kiểm tra xem user có tồn tại không
    const user = await User.findOne({ phone });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    // So sánh mật khẩu đã nhập với mật khẩu đã hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    // Tạo token JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "2d" });

    res.json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
