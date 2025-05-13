const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");
const { sendOTPEmail, logger } = require("../config/emailConfig");
const OTPService = require("../services/otpService");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Lưu trữ OTP tạm thời (trong thực tế nên dùng Redis)
const otpStore = new Map();

// Hàm tạo OTP ngẫu nhiên
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Rate limiting cho API đăng nhập và quên mật khẩu
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Giới hạn 5 request mỗi IP trong 15 phút
  message: { message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút" }
});

// API đăng ký
router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt" 
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    // Kiểm tra xem số điện thoại hoặc email đã tồn tại chưa
    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email }] 
    });
    if (existingUser) {
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: "Số điện thoại đã được sử dụng" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = new User({
      name,
      phone,
      email,
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
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
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

    // Kiểm tra tài khoản có bị khóa không
    if (user.status === "banned") {
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ tới 0396504803 để biết chi tiết."
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Tăng số lần đăng nhập thất bại
      user.failedLoginAttempts += 1;

      // Nếu đã đạt 5 lần thất bại, khóa tài khoản vĩnh viễn
      if (user.failedLoginAttempts >= 5) {
        user.status = "banned";
        user.failedLoginAttempts = 0;
        await user.save();
        return res.status(403).json({ 
          message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ tới 0396504803 để biết chi tiết."
        });
      }

      await user.save();
      return res.status(400).json({ 
        message: `Mật khẩu không đúng. Bạn còn ${5 - user.failedLoginAttempts} lần thử.`
      });
    }

    // Reset số lần đăng nhập thất bại khi đăng nhập thành công
    user.failedLoginAttempts = 0;

    // Nếu tài khoản chưa có email, yêu cầu cập nhật
    if (!user.email) {
      return res.status(200).json({
        token: null,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          requireEmail: true
        },
        message: "Vui lòng cập nhật email của bạn để tiếp tục sử dụng tài khoản"
      });
    }

    await user.save();

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
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ error: "Lỗi khi đăng nhập" });
  }
});

// API quên mật khẩu
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra email tồn tại
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });
    }

    // Kiểm tra giới hạn yêu cầu OTP
    const limitCheck = await OTPService.checkRequestLimit(email);
    if (!limitCheck.allowed) {
      return res.status(429).json({ message: limitCheck.message });
    }

    // Tạo OTP mới
    const otp = await OTPService.generateOTP(email);

    // Gửi OTP qua email (bất đồng bộ)
    sendOTPEmail(email, otp)
      .then(() => {
        logger.info('OTP email sent successfully', { email });
      })
      .catch(error => {
        logger.error('Failed to send OTP email', { email, error: error.message });
      });

    // Trả về response ngay lập tức
    res.status(200).json({ 
      message: "Mã xác thực đã được gửi đến email của bạn",
      email: email
    });
  } catch (error) {
    logger.error("Lỗi quên mật khẩu:", { error: error.message });
    res.status(500).json({ error: "Lỗi khi xử lý yêu cầu" });
  }
});

// API xác thực OTP và đặt lại mật khẩu
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Kiểm tra OTP
    const otpCheck = await OTPService.verifyOTP(email, otp);
    if (!otpCheck.valid) {
      return res.status(400).json({ message: otpCheck.message });
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt" 
      });
    }

    // Tìm user và cập nhật mật khẩu
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    user.updateAt = Date.now();
    await user.save();

    logger.info('Password reset successful', { email });
    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    logger.error("Lỗi đặt lại mật khẩu:", { error: error.message });
    res.status(500).json({ error: "Lỗi khi đặt lại mật khẩu" });
  }
});

//Tạo user mới
router.post("/", async (req, res) => {
  try {
    const { name, phone, password, role, status } = req.body;

    // Kiểm tra password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ thường, chữ hoa và số."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      role: role || 'user',
      status: status || 'active'
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi thêm user" });
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

//Lấy thông tin một user theo ID
router.get("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID không hợp lệ" });
        }

        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User không tồn tại" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

router.get("/my-profile",auth, async (req, res) => {
  try {

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Lỗi khi lấy thống tin người dùng" });
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
// API đăng ký
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
// Lấy đếm số tài khoản
router.get('/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ total: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Sửa thông tin tài khoản
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, phone, avatar, email } = req.body;

    // Tìm user khác đang dùng cùng số điện thoại
    const existingUser = await User.findOne({ phone, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại!" });
    }

    // Tìm user khác đang dùng cùng email
    const existingEmailUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    // Cập nhật thông tin người dùng
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        avatar,
        email,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// API đổi mật khẩu
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    // 1. Tìm user trong database bằng ID thực
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // 2. Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    // 3. Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
    if (oldPassword === newPassword) {
      return res.status(400).json({ 
        message: "Mật khẩu mới phải khác mật khẩu cũ" 
      });
    }
    // 4. Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 5. Cập nhật mật khẩu mới (dùng save() thay vì findByIdAndUpdate)
    user.password = hashedPassword;
    user.updateAt = Date.now();
    await user.save();

    // 6. Trả về thành công
    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi server khi đổi mật khẩu" });
  }
});

// API mở khóa tài khoản (chỉ admin)
router.patch('/:id/unlock', auth, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        failedLoginAttempts: 0 
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ 
      message: 'Mở khóa tài khoản thành công',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error unlocking user account:', error);
    res.status(500).json({ message: 'Lỗi khi mở khóa tài khoản' });
  }
});

module.exports = router;
