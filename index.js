const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const utilitiesRoutes = require("./routes/utilitiesRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const postRoutes = require("./routes/postRoutes");
const packageRoutes = require("./routes/packageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối MongoDB
connectDB();

// Định nghĩa routes
app.use("/api/users", userRoutes);
app.use("/api/utilities", utilitiesRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/payments", paymentRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
