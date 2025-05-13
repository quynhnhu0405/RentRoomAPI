const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/Post");
const Category = require("../models/Category");
const Payment = require("../models/Payment");
const { auth, authAdmin } = require("../middleware/auth");
const Package = require("../models/Package");

const router = express.Router();

// API lấy tất cả bài đăng
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("packageDetails", "name priceday priceweek pricemonth level")
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Lỗi khi tìm bài:", error);
    res.status(500).json({ error: "Lỗi khi tìm bài" });
  }
});

router.get("/latest-posts", async (req, res) => {
  try {
    // Fetch the latest posts without any ID validation
    const latestPosts = await Post.find({ isVisible: true, status: "available" })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("category", "name")
      .populate("landlordId", "name")
      .populate("packageDetails", "name priceday priceweek pricemonth level");

    res.json(latestPosts);
  } catch (err) {
    // Just return the error message directly, no ID validation here
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
router.get("/count", async (req, res) => {
  try {
    const count = await Post.countDocuments();
    res.json({ total: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//API lấy các bài đăng của 1 users
router.get("/my-posts", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Lấy tất cả bài post của user
    const posts = await Post.find({ landlordId: userId, isVisible: true })
      .populate("category", "name") // Lấy thêm tên category
      .populate("packageDetails", "name")
      .populate("utilityDetails", "name") // Lấy thêm tên các tiện ích
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .lean();

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
      message: error.message, // Thêm thông báo lỗi chi tiết
    });
  }
});
// API lấy danh sách phòng trọ
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

    // Xây dựng query
    const query = {
      "category.name": "Phòng trọ",
      status: "available",
      isVisible: true,
    };

    // Tìm theo từ khóa trong tiêu đề hoặc mô tả
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
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

    const posts = await Post.find(query)
      .sort({ "packageDetails.level": 1 })
      .limit(8)
      .populate("packageDetails", "name priceday priceweek pricemonth level")
      .populate("utilityDetails", "name")
      .lean();

    const formattedPosts = posts.map((post) => ({
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

// API lấy danh sách căn hộ
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

    // Xây dựng query
    const query = {
      "category.name": "Chung cư căn hộ",
      status: "available",
      isVisible: true,
    };

    // Tìm theo từ khóa trong tiêu đề hoặc mô tả
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
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

    const posts = await Post.find(query)
      .sort({ "packageDetails.level": 1 })
      .limit(8)
      .populate("packageDetails", "name priceday priceweek pricemonth level")
      .populate("utilityDetails", "name")
      .lean();
    const formattedPosts = posts.map((post) => ({
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

// API lấy danh sách ở ghép
router.get("/o-ghep", async (req, res) => {
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

    // Xây dựng query
    const query = {
      "category.name": "Ở ghép",
      status: "available",
      isVisible: true,
    };

    // Tìm theo từ khóa trong tiêu đề hoặc mô tả
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
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

    const posts = await Post.find(query)
      .sort({ "packageDetails.level": 1 })
      .limit(8)
      .populate("packageDetails", "name priceday priceweek pricemonth level")
      .populate("utilityDetails", "name")
      .lean();
    const formattedPosts = posts.map((post) => ({
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

// API lấy danh sách bài đăng của người dùng đang đăng nhập
router.get("/my-posts", auth, async (req, res) => {
  try {
    const posts = await Post.find({ landlordId: req.user._id })
      .populate("packageDetails", "name priceday priceweek pricemonth level")
      .populate("utilityDetails", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Lỗi khi lấy bài đăng của người dùng:", error);
    res.status(500).json({ error: "Lỗi khi lấy bài đăng" });
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

// API Tạo bài đăng mới (yêu cầu đăng nhập)
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      area,
      category,
      location,
      utilities,
      images,
      package: selectedPackageList,
      expiryDate,
      transactionCode,
    } = req.body;
    // Kiểm tra category
    const categoryExists = await Category.findById(category.id);
    if (!categoryExists) {
      return res.status(400).json({ message: "Danh mục không tồn tại" });
    }
    // Validate package list
    if (!selectedPackageList || !Array.isArray(selectedPackageList) || !selectedPackageList[0]?.id) {
      return res.status(400).json({ error: "Dữ liệu gói không hợp lệ" });
    }
    
    const packageExists = await Package.findById(selectedPackageList[0].id);

    // Tạo bài đăng mới với landlordId là ID của user đang đăng nhập
    const newPost = new Post({
      title,
      description,
      price,
      area,
      category,
      location,
      utilities,
      images,
      landlordId: req.user._id,
      package: selectedPackageList,
      expiryDate,
      status: "unpaid",
    });

    await newPost.save();
    const totalPrice = packageExists
      ? packageExists[`price${selectedPackageList[0].period}`] * selectedPackageList[0].quantity
      : 0;

    // Automatically create a payment record in pending status
    const newPayment = new Payment({
      PostId: newPost._id,
      landlordId: req.user._id,
      total: totalPrice, // Use the provided total price or default to 0
      status: "pending", // Payment starts as pending and will be approved by admin
      transactionCode,
    });

    await newPayment.save();

    // Return both the post and payment information
    res.status(201).json({
      post: newPost,
      payment: newPayment,
      message: "Bài đăng đã được tạo, thanh toán đang chờ xác nhận",
    });
  } catch (error) {
    console.error("Lỗi khi tạo bài đăng:", error);
    res
      .status(500)
      .json({ error: "Lỗi khi tạo bài đăng", details: error.message });
  }
});

// API Lấy chi tiết bài đăng
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const post = await Post.findOne({ _id: id, isVisible: true })
      .populate("packageDetails", "name priceday priceweek pricemonth level")
      .populate("utilityDetails", "name")
      .populate({
        path: "landlordId",
        select: "name phone avatar createAt",
      })
      .lean();

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết bài đăng:", error);
    res.status(500).json({ error: "Lỗi khi lấy chi tiết bài đăng" });
  }
});

// API Cập nhật bài đăng (yêu cầu đăng nhập và là chủ bài đăng hoặc admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    // Tìm bài đăng
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    // Kiểm tra quyền (phải là chủ bài đăng hoặc admin)
    if (
      post.landlordId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền cập nhật bài đăng này" });
    }

    // Cập nhật bài đăng
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { ...req.body, status: "waiting" }, // Reset về trạng thái chờ duyệt khi cập nhật
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Lỗi khi cập nhật bài đăng:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bài đăng" });
  }
});

// API admin phê duyệt/từ chối bài đăng
// PATCH /api/posts/:id/status
router.patch("/admin/:id/status", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, expiryDate } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    // Validate status
    const allowedStatuses = [
      "unpaid",
      "available",
      "waiting",
      "expired",
      "rejected",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Trạng thái phải là một trong: ${allowedStatuses.join(", ")}`,
      });
    }

    const updateData = { status };
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedPost) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái bài đăng:", err);
    res.status(500).json({ error: err.message });
  }
});

// API ẩn bài đăng (yêu cầu đăng nhập và là chủ bài đăng hoặc admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { isVisible: false }, // Chỉ cập nhật trường isVisible
      { new: true } // Trả về bài đăng sau khi cập nhật
    );
    // Kiểm tra xem bài đăng có tồn tại không
    if (!updatedPost) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    // Kiểm tra quyền (phải là chủ bài đăng hoặc admin)
    if (
      updatedPost.landlordId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Không có quyền cập nhật bài đăng này" });
    }

    // Kiểm tra quyền (phải là chủ bài đăng hoặc admin)
    if (
      updatedPost.landlordId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Không có quyền cập nhật bài đăng này" });
    }

    return res.status(200).json();
  } catch (error) {
    console.error("Lỗi khi cập nhật bài đăng:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
});
// API Gia hạn bài đăng (yêu cầu đăng nhập)
router.put("/:postId/renew", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const { package: packageArr, expiryDate,transactionCode } = req.body;

    // Kiểm tra tồn tại bài đăng
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    // Kiểm tra gói gia hạn
    if (
      !packageArr ||
      !Array.isArray(packageArr) ||
      packageArr.length === 0
    ) {
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
    let currentExpiry = post.expiryDate > new Date() ? new Date(post.expiryDate) : new Date();
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
      transactionCode,
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
