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
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['available', 'approved', 'rejected', 'deleted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
module.exports = router;
