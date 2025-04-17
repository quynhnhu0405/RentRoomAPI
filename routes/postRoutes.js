const express = require("express");
const {
  Post,
  Category,
  Payment,
  Package,
  User,
  Utilities,
  sequelize,
} = require("../models");
const { auth, authAdmin } = require("../middleware/auth");
const { Op } = require("sequelize");

const router = express.Router();

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        { model: Package },
        { model: Category },
        { model: User, attributes: ["name"] },
      ],
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error finding posts:", error);
    res.status(500).json({ error: "Error finding posts" });
  }
});

// Get latest posts
router.get("/latest-posts", async (req, res) => {
  try {
    // Fetch the latest posts
    const latestPosts = await Post.findAll({
      where: {
        featured: true,
        status: "active",
      },
      order: [["createdAt", "DESC"]],
      limit: 8,
      include: [
        { model: Category, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
    });

    res.json(latestPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get total post count
router.get("/count", async (req, res) => {
  try {
    const count = await Post.count();
    res.json({ total: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get posts by current user
router.get("/my-posts", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all posts by user
    const posts = await Post.findAll({
      where: {
        userId,
        featured: true,
      },
      include: [
        { model: Category, attributes: ["name"] },
        { model: Package, attributes: ["name"] },
        { model: Utilities, attributes: ["name"], through: { attributes: [] } },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error getting posts by user:", error);
    res.status(500).json({
      success: false,
      error: "Server error while getting posts",
      message: error.message,
    });
  }
});

// Get room listings
router.get("/phong-tro", async (req, res) => {
  try {
    const {
      keyword,
      province,
      district,
      ward,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
    } = req.query;

    // Build query conditions
    const whereConditions = {
      status: "active",
      "$Category.name$": "Phòng trọ",
    };

    // Search by keywords in title or description
    if (keyword) {
      whereConditions[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // Search by location
    if (province) {
      whereConditions.province = province;
    }

    if (district) {
      whereConditions.district = district;
    }

    if (ward) {
      whereConditions.ward = ward;
    }

    // Search by price range
    if (priceMin || priceMax) {
      whereConditions.price = {};
      if (priceMin) whereConditions.price[Op.gte] = parseInt(priceMin);
      if (priceMax) whereConditions.price[Op.lte] = parseInt(priceMax);
    }

    // Search by area range
    if (areaMin || areaMax) {
      whereConditions.area = {};
      if (areaMin) whereConditions.area[Op.gte] = parseInt(areaMin);
      if (areaMax) whereConditions.area[Op.lte] = parseInt(areaMax);
    }

    const posts = await Post.findAll({
      where: whereConditions,
      include: [
        { model: Category },
        { model: Package },
        { model: Utilities, through: { attributes: [] } },
      ],
      order: [
        ["featured", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: 8,
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error searching for rooms:", error);
    res.status(500).json({
      error: "Error searching for rooms",
      details: error.message,
    });
  }
});

// Get apartment listings
router.get("/can-ho", async (req, res) => {
  try {
    const {
      keyword,
      province,
      district,
      ward,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
    } = req.query;

    // Build query conditions
    const whereConditions = {
      status: "active",
      "$Category.name$": "Căn hộ chung cư",
    };

    // Search by keywords in title or description
    if (keyword) {
      whereConditions[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // Search by location
    if (province) {
      whereConditions.province = province;
    }

    if (district) {
      whereConditions.district = district;
    }

    if (ward) {
      whereConditions.ward = ward;
    }

    // Search by price range
    if (priceMin || priceMax) {
      whereConditions.price = {};
      if (priceMin) whereConditions.price[Op.gte] = parseInt(priceMin);
      if (priceMax) whereConditions.price[Op.lte] = parseInt(priceMax);
    }

    // Search by area range
    if (areaMin || areaMax) {
      whereConditions.area = {};
      if (areaMin) whereConditions.area[Op.gte] = parseInt(areaMin);
      if (areaMax) whereConditions.area[Op.lte] = parseInt(areaMax);
    }

    const posts = await Post.findAll({
      where: whereConditions,
      include: [
        { model: Category },
        { model: Package },
        { model: Utilities, through: { attributes: [] } },
      ],
      order: [
        ["featured", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: 8,
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error searching for apartments:", error);
    res.status(500).json({
      error: "Error searching for apartments",
      details: error.message,
    });
  }
});

// Search API
router.get("/search", async (req, res) => {
  try {
    const {
      keyword,
      category,
      province,
      district,
      ward,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query conditions
    const whereConditions = {
      status: "active",
    };

    // Search by category
    if (category) {
      whereConditions["$Category.name$"] = category;
    }

    // Search by keywords in title or description
    if (keyword) {
      whereConditions[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // Search by location
    if (province) {
      whereConditions.province = province;
    }

    if (district) {
      whereConditions.district = district;
    }

    if (ward) {
      whereConditions.ward = ward;
    }

    // Search by price range
    if (priceMin || priceMax) {
      whereConditions.price = {};
      if (priceMin) whereConditions.price[Op.gte] = parseInt(priceMin);
      if (priceMax) whereConditions.price[Op.lte] = parseInt(priceMax);
    }

    // Search by area range
    if (areaMin || areaMax) {
      whereConditions.area = {};
      if (areaMin) whereConditions.area[Op.gte] = parseInt(areaMin);
      if (areaMax) whereConditions.area[Op.lte] = parseInt(areaMax);
    }

    // Define sort order
    let order = [["createdAt", "DESC"]]; // Default: newest

    if (sort === "price-asc") {
      order = [["price", "ASC"]];
    } else if (sort === "price-desc") {
      order = [["price", "DESC"]];
    } else if (sort === "area-asc") {
      order = [["area", "ASC"]];
    } else if (sort === "area-desc") {
      order = [["area", "DESC"]];
    }

    // Always prioritize featured posts
    order.unshift(["featured", "DESC"]);

    // Execute query with pagination
    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereConditions,
      include: [
        { model: Category },
        { model: User, attributes: ["name"] },
        { model: Utilities, through: { attributes: [] } },
      ],
      order,
      offset,
      limit: parseInt(limit),
    });

    res.status(200).json({
      posts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error searching:", error);
    res
      .status(500)
      .json({ error: "Error during search", details: error.message });
  }
});

// API tìm kiếm bài đăng
router.get("/search", async (req, res) => {
  try {
    const {
      keyword,
      category,
      province,
      district,
      ward,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
    } = req.query;

    // Xây dựng query
    const query = { status: "available", isVisible: true };

    // Tìm theo từ khóa trong tiêu đề hoặc mô tả
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    // Tìm theo category
    if (category) {
      query["category.name"] = category;
    }

    // Tìm theo vị trí
    if (province) {
      query["location.province"] = province;
    }

    if (district) {
      query["location.district"] = district;
    }

    if (ward) {
      query["location.ward"] = ward;
    }

    // Tìm theo khoảng giá
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseInt(priceMin);
      if (priceMax) query.price.$lte = parseInt(priceMax);
    }

    // Tìm theo khoảng diện tích
    if (areaMin || areaMax) {
      query.area = {};
      if (areaMin) query.area.$gte = parseInt(areaMin);
      if (areaMax) query.area.$lte = parseInt(areaMax);
    }

    // Thực hiện tìm kiếm
    const posts = await Post.find(query)
      .populate("packageDetails", "name priceday priceweek pricemonth level")
      .populate("utilityDetails", "name")
      .sort({ "packageDetails.level": 1, createdAt: -1 })
      .lean();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm bài đăng:", error);
    res.status(500).json({ error: "Lỗi khi tìm kiếm bài đăng" });
  }
});

// Create a new post
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      area,
      categoryId,
      address,
      province,
      district,
      ward,
      utilities,
      images,
      packageId,
    } = req.body;

    // Check if category exists
    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category doesn't exist" });
    }

    // Check if package exists
    const packageExists = await Package.findByPk(packageId);
    if (!packageExists) {
      return res.status(400).json({ message: "Package doesn't exist" });
    }

    // Calculate expiry date based on package duration
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + packageExists.duration);

    // Create new post with current user ID
    const newPost = await Post.create({
      title,
      description,
      price: parseFloat(price),
      area: parseFloat(area),
      categoryId,
      address,
      province,
      district,
      ward,
      images: images || [],
      userId: req.user.id,
      status: "pending", // Default is pending until payment
      expiryDate,
      featured: false,
      viewCount: 0,
    });

    // Add utilities if provided
    if (utilities && utilities.length > 0) {
      await newPost.addUtilities(utilities);
    }

    // Create a payment record in pending status
    const newPayment = await Payment.create({
      postId: newPost.id,
      userId: req.user.id,
      packageId,
      amount: packageExists.price,
      status: "pending",
      startDate: new Date(),
      endDate: expiryDate,
    });

    // Return both the post and payment information
    res.status(201).json({
      post: newPost,
      payment: newPayment,
      message: "Post created successfully. Please complete the payment.",
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res
      .status(500)
      .json({ error: "Error creating post", details: error.message });
  }
});

// Get post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: User, attributes: ["name", "phone"] },
        { model: Utilities, through: { attributes: [] } },
      ],
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Increment view count
    await Post.update(
      { viewCount: post.viewCount + 1 },
      { where: { id: req.params.id } }
    );

    // Return with incremented view count
    post.viewCount += 1;
    res.status(200).json(post);
  } catch (error) {
    console.error("Error getting post:", error);
    res.status(500).json({ error: "Error retrieving post" });
  }
});

// Update a post
router.put("/:id", auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check permissions (must be post owner or admin)
    if (post.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You don't have permission to update this post" });
    }

    // Update post
    const [updated] = await Post.update(req.body, {
      where: { id: postId },
    });

    // If utilities are provided, update them
    if (req.body.utilities) {
      const post = await Post.findByPk(postId);
      await post.setUtilities(req.body.utilities);
    }

    // Get updated post
    const updatedPost = await Post.findByPk(postId, {
      include: [
        { model: Category },
        { model: Utilities, through: { attributes: [] } },
      ],
    });

    res.status(200).json({
      post: updatedPost,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res
      .status(500)
      .json({ error: "Error updating post", details: error.message });
  }
});

// Delete a post
router.delete("/:id", auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check permissions (must be post owner or admin)
    if (post.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You don't have permission to delete this post" });
    }

    // Delete post
    await Post.destroy({ where: { id: postId } });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Error deleting post" });
  }
});

// Change post status
router.patch("/:id/status", authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const postId = req.params.id;

    // Validate status
    const validStatuses = [
      "pending",
      "active",
      "rented",
      "expired",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update post status
    const [updated] = await Post.update({ status }, { where: { id: postId } });

    if (updated === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const updatedPost = await Post.findByPk(postId);
    res.status(200).json({
      post: updatedPost,
      message: `Post status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating post status:", error);
    res.status(500).json({ error: "Error updating status" });
  }
});

// API Gia hạn bài đăng (yêu cầu đăng nhập)
router.put("/:postId/renew", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const { package: packageArr, expiryDate } = req.body;

    // Kiểm tra tồn tại bài đăng
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    // Kiểm tra gói gia hạn
    if (!packageArr || !Array.isArray(packageArr) || packageArr.length === 0) {
      return res.status(400).json({ message: "Thiếu thông tin gói gia hạn" });
    }

    const { id, period, quantity } = packageArr[0];

    if (!id || !period || !quantity) {
      return res.status(400).json({ message: "Thiếu thông tin gói gia hạn" });
    }

    // Kiểm tra tồn tại của gói
    const packageExists = await Package.findById(id);
    if (!packageExists) {
      return res.status(400).json({ message: "Gói đăng tin không tồn tại" });
    }

    // Tính toán giá
    const priceKey = `price${period}`;
    const pricePerUnit = packageExists[priceKey];
    if (!pricePerUnit) {
      return res.status(400).json({ message: "Chu kỳ không hợp lệ" });
    }
    const totalPrice = pricePerUnit * quantity;

    // Tính toán ngày hết hạn mới
    let currentExpiry =
      post.expiryDate > new Date() ? new Date(post.expiryDate) : new Date();
    const daysToAdd = {
      day: quantity,
      week: quantity * 7,
      month: quantity * 30,
    }[period];

    currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);

    // Gói gia hạn mới
    const newPackageEntry = {
      id: packageExists._id,
      period,
      quantity,
    };

    // Cập nhật bài đăng
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          package: {
            $each: [newPackageEntry],
            $position: 0, // Thêm vào đầu mảng
          },
        },
        $set: {
          expiryDate: currentExpiry,
          status: "unpaid",
        },
      },
      { new: true }
    );

    // Tạo bản ghi thanh toán
    const newPayment = new Payment({
      PostId: updatedPost._id,
      landlordId: userId,
      total: totalPrice,
      status: "pending",
    });

    await newPayment.save();

    res.json({
      post: updatedPost,
      payment: newPayment,
      message: "Yêu cầu gia hạn đã được tạo, vui lòng thanh toán",
    });
  } catch (error) {
    console.error("Lỗi khi gia hạn bài đăng:", error);
    res.status(500).json({
      error: "Lỗi khi gia hạn bài đăng",
      details: error.message,
    });
  }
});

// API đếm bài đăng theo userId
router.get("/count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }
    const count = await Post.countDocuments({ landlordId: userId });
    res.json({ count });
  } catch (error) {
    console.error("Lỗi khi đếm bài đăng:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi", error: error.message });
  }
});

module.exports = router;
