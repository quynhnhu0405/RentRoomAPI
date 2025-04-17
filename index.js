const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { syncDatabase } = require("./models/index");
const userRoutes = require("./routes/userRoutes");
const utilitiesRoutes = require("./routes/utilitiesRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const postRoutes = require("./routes/postRoutes");
const packageRoutes = require("./routes/packageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
require("dotenv").config();

const app = express();
app.use(cors());

// Increase JSON payload limit (for PUT/POST requests)
app.use(express.json({ limit: "10mb" })); // Adjust the limit as needed

// If you're using URL-encoded data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect to MySQL database
connectDB();

// Sync all models with the database
syncDatabase();

// Define routes
app.use("/api/users", userRoutes);
app.use("/api/utilities", utilitiesRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
