const { sequelize } = require("../config/db");
const User = require("./User");
const Category = require("./Category");
const Post = require("./Post");
const Package = require("./Package");
const Payment = require("./Payment");
const Utilities = require("./Utilities");

// Initialize models
const models = {
  User,
  Category,
  Post,
  Package,
  Payment,
  Utilities,
};

// Define relationships
User.hasMany(Post, { foreignKey: "userId" });
Post.belongsTo(User, { foreignKey: "userId" });

Category.hasMany(Post, { foreignKey: "categoryId" });
Post.belongsTo(Category, { foreignKey: "categoryId" });

User.hasMany(Payment, { foreignKey: "userId" });
Payment.belongsTo(User, { foreignKey: "userId" });

Package.hasMany(Payment, { foreignKey: "packageId" });
Payment.belongsTo(Package, { foreignKey: "packageId" });

Post.belongsToMany(Utilities, {
  through: "PostUtilities",
  foreignKey: "postId",
});
Utilities.belongsToMany(Post, {
  through: "PostUtilities",
  foreignKey: "utilityId",
});

// Sync all models with database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synced successfully");
  } catch (error) {
    console.error("❌ Error syncing database tables:", error);
    process.exit(1);
  }
};

module.exports = {
  ...models,
  syncDatabase,
};
