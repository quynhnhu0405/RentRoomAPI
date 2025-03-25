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

module.exports = router;
