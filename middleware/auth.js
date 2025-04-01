const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware xác thực người dùng
const auth = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Không có token xác thực" });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    // Lưu thông tin user vào request để sử dụng ở các middleware khác
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};

// Middleware kiểm tra quyền admin
const authAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && req.user.role === "admin") {
        next();
      } else {
        res
          .status(403)
          .json({ message: "Bạn không có quyền thực hiện thao tác này" });
      }
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ message: "Xác thực không thành công" });
  }
};

module.exports = { auth, authAdmin };
