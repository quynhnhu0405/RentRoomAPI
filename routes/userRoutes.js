const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");
const router = express.Router();
const { Op } = require("sequelize");

// Register API
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Check if phone number already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      name,
      phone,
      password: hashedPassword,
    });

    // Create token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Error during registration" });
  }
});

// Login API
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check user exists
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid phone number or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid phone number or password" });
    }

    // Check account status
    if (user.status !== "active") {
      return res.status(403).json({ message: "Your account has been locked" });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error during login" });
  }
});

// Forgot password API
router.post("/forgot-password", async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this phone number" });
    }

    // In production, send verification code via SMS or email
    // For now, just return success

    res
      .status(200)
      .json({ message: "Please check your messages to reset your password" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Error processing request" });
  }
});

// Add User API (admin only)
router.post("/", async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Error adding user" });
  }
});

// Get all users API (admin only)
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error finding users" });
  }
});

// Get user by ID
router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user info:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/my-profile", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error getting user information" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const [updated] = await User.update(
      { status },
      { where: { id: req.params.id } }
    );

    if (updated === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findByPk(req.params.id);
    res.json(user);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Error updating status" });
  }
});

// Delete user account
router.delete("/:id", async (req, res) => {
  try {
    const deletedCount = await User.destroy({
      where: { id: req.params.id },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user account" });
  }
});

// API đăng ký
router.post("/", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      role: role || "user",
      status: "active",
    });
    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Lỗi khi tạo tài khoản" });
  }
});

// Get user count
router.get("/count", async (req, res) => {
  try {
    const count = await User.count();
    res.json({ total: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user information
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    // Check if phone number is already used by another user
    const existingUser = await User.findOne({
      where: {
        phone,
        id: { [Op.ne]: req.params.id },
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Phone number already exists!" });
    }

    const [updated] = await User.update(
      {
        name,
        phone,
        avatar,
        updatedAt: new Date(),
      },
      { where: { id: req.params.id } }
    );

    if (updated === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password API
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user in database by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Check new password is different from old password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the old password",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.update(
      {
        password: hashedPassword,
        updatedAt: new Date(),
      },
      { where: { id: userId } }
    );

    // Return success
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error while changing password" });
  }
});

module.exports = router;
