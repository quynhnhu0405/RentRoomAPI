const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");
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
module.exports = router;
