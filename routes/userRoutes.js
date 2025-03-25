const express = require("express");
const User = require("../models/User");

const router = express.Router();

// API Thêm User
router.post("/", async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thêm user" });
    }
});

router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi tìm user" });
    }
});
router.get("/user/:id", async (req, res) => {
    try {
      const { id } = req.params; // Lấy id từ URL
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: "Lỗi server" });
    }
  });

module.exports = router;
