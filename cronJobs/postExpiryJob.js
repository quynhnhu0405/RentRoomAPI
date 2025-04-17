const cron = require("node-cron");
const Post = require("../models/Post");
// Hàm job kiểm tra và cập nhật bài hết hạn
const startPostExpiryJob = () => {
  // Chạy mỗi phút một lần
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    try {
      const result = await Post.updateMany(
        { expiryDate: { $lte: now }, status: "available" },
        { $set: { status: "expired"} }
      );

      if (result.modifiedCount > 0) {
        console.log(`Đã cập nhật ${result.modifiedCount} bài đăng hết hạn lúc ${now}`);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái bài hết hạn:", error);
    }
  });

  console.log("Cron job kiểm tra bài hết hạn đã khởi động.");
};
module.exports = { startPostExpiryJob };