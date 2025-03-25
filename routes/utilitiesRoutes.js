const express = require("express");
const Utilities = require("../models/Utilities");

const router = express.Router();

// API Thêm tiện ích
router.post("/", async (req, res) => {
    try {
        const newUtilitie = new Utilities(req.body);
        await newUtilitie.save();
        res.status(201).json(newUtilitie);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thêm tiện ích" });
    }
});

router.get("/", async (req, res) => {
    try {
        const utilities = await Utilities.find();
        res.status(200).json(utilities);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi tìm tiện ích" });
    }
});

module.exports = router;
