const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");
const router = express.Router();


// API đăng ký
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt" 
      });
    }

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
//Tạo user mới
router.post("/", async (req, res) => {
  try {
    const { name, phone, password, role, status } = req.body;
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

router.get("/my-profile", auth, async (req, res) => {
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
router.put("/:id",auth, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser && existingUser._id.toString() !== req.params.id) {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại!" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        avatar,
        updateAt: Date.now(),
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
