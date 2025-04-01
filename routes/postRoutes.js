const express = require("express");
const Post = require("../models/Post");
const Category = require("../models/Category");

const router = express.Router();

// API Thêm bài đăng
router.post("/", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi thêm bài" });
  }
});
router.get("/", async (req, res) => {
  try {
      const posts = await Post.find()
          .populate('packageDetails', 'name priceday priceweek pricemonth level')
          .lean();

      const formattedPosts = posts.map(post => ({
          newField: "Giá trị mới",
          ...post,
      }));

      res.status(200).json(formattedPosts);
  } catch (error) {
      console.error("Lỗi khi tìm bài:", error);
      res.status(500).json({ error: "Lỗi khi tìm bài" });
  }
});
router.patch('/check-expired-posts', async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 giờ trước
    
    // Tìm các bài đăng đã hết hạn trong vòng 1 giờ qua
    const expiredPosts = await Post.find({
      status: 'available',
      expiryDate: { 
        $gte: oneHourAgo,
        $lt: now
      }
    });
    
    // Cập nhật trạng thái
    const postIds = expiredPosts.map(post => post._id);
    await Post.updateMany(
      { _id: { $in: postIds } },
      { $set: { status: 'expired' } }
    );
    
    res.json({
      success: true,
      expiredCount: postIds.length,
      message: `Đã cập nhật ${postIds.length} bài đăng hết hạn`
    });
  } catch (error) {
    console.error('Error checking expired posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra bài đăng hết hạn'
    });
  }
});
router.get("/phong-tro", async (req, res) => {
    try {
      const posts = await Post.find({
        "category.name": "Phòng trọ",
        status: "available"
      })
      .sort({ 'packageDetails.level': 1 })
      .limit(8)
      .populate('packageDetails', 'name priceday priceweek pricemonth level')
      .populate('utilityDetails', 'name')
      .lean();
      if (!posts.length) {
        return res.status(404).json({
          message: "Không tìm thấy phòng trọ nào!",
        });
      }
      const formattedPosts = posts.map(post => ({
        ...post,
      }));
  
      res.status(200).json(formattedPosts);
    } catch (error) {
      console.error("Lỗi khi tìm phòng trọ:", error);
      res.status(500).json({
        error: "Lỗi khi tìm phòng trọ",
        details: error.message,
      });
    }
  });
router.get("/can-ho", async (req, res) => {
    try {
        const posts = await Post.find({
          "category.name": "Chung cư căn hộ",
          status: "available"
        })
        .sort({ 'packageDetails.level': 1 }) 
        .limit(8)
        .populate('packageDetails', 'name priceday priceweek pricemonth level')
        .populate('utilityDetails', 'name')
        .lean();
        if (!posts.length) {
          return res.status(404).json({
            message: "Không tìm thấy chung cư căn hộ nào!",
          });
        }
        const formattedPosts = posts.map(post => ({
          ...post,
        }));
    
        res.status(200).json(formattedPosts);
      } catch (error) {
        console.error("Lỗi khi tìm chung cư căn hộ:", error);
        res.status(500).json({
          error: "Lỗi khi tìm chung cư căn hộ",
          details: error.message,
        });
      }
});
router.get("/o-ghep", async (req, res) => {
    try {
        const posts = await Post.find({
          "category.name": "Ở ghép",
          status: "available"
        })
        .sort({ 'packageDetails.level': 1 }) 
        .limit(8)
        .populate('packageDetails', 'name priceday priceweek pricemonth level')
        .populate('utilityDetails', 'name')
        .lean();
        if (!posts.length) {
          return res.status(404).json({
            message: "Không tìm thấy ở ghép nào!",
          });
        }
        const formattedPosts = posts.map(post => ({
          ...post,
        }));
    
        res.status(200).json(formattedPosts);
      } catch (error) {
        console.error("Lỗi khi tìm ở ghép:", error);
        res.status(500).json({
          error: "Lỗi khi tìm ở ghép",
          details: error.message,
        });
      }
});
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    // Validate status
    const allowedStatuses = ["approved", "rejected", "available", "deleted"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Trạng thái phải là một trong: ${allowedStatuses.join(", ")}` });
    }

    // Rest of your logic...
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
