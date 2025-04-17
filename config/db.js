const mongoose = require("mongoose");
const {startPostExpiryJob}  = require ("../cronJobs/postExpiryJob.js");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected...");

    // Khởi động cron job sau khi kết nối thành công
    startPostExpiryJob();
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
