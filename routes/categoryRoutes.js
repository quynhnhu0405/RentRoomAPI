const express = require("express");
const Category = require("../models/Category");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const newCategory = new Category(req.body);
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thêm category" });
    }
});

router.get("/", async (req, res) => {
    try {
        const category = await Category.find();
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi tìm category" });
    }
});

module.exports = router;