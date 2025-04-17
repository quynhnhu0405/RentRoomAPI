const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No authentication token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findOne({
      where: { id: decoded.id },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is locked" });
    }

    // Save user info to request for use in other middleware
    req.user = user.toJSON();

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Admin role check middleware
const authAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && req.user.role === "admin") {
        next();
      } else {
        res
          .status(403)
          .json({
            message: "You don't have permission to perform this action",
          });
      }
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = { auth, authAdmin };
