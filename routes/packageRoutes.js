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
router.patch('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { priceday, priceweek, pricemonth } = req.body;
  
      // Validate input
      if (!priceday || !priceweek || !pricemonth) {
        return res.status(400).json({ message: 'Thiếu thông tin giá' });
      }
  
      const updatedPackage = await Package.findByIdAndUpdate(
        id,
        {
          priceday: Number(priceday),
          priceweek: Number(priceweek),
          pricemonth: Number(pricemonth)
        },
        { new: true, runValidators: true }
      );
  
      if (!updatedPackage) {
        return res.status(404).json({ message: 'Không tìm thấy gói' });
      }
  
      res.json(updatedPackage);
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(400).json({ 
        message: 'Cập nhật giá thất bại',
        error: error.message 
      });
    }
  });

module.exports = router;
