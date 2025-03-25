const express = require("express");
const Package = require("../models/Package");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const package = await Package.find();
        res.status(200).json(package);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi tìm gói" });
    }
});
module.exports = router;
