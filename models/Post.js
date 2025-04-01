const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    area: { type: Number, required: true },
    category: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
      name: { type: String, required: true },
    },
    location: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      ward: { type: String, required: true },
      street: { type: String, required: false },
    },
    utilities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Utility" }],
    images: [{ type: String }],
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["waiting", "available", "expired"], default: "waiting" },
    package: [{ type: mongoose.Schema.Types.ObjectId, ref: "Package" }],
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true } // timestamps tự động tạo createdAt & updatedAt
);
// Virtual cho package
PostSchema.virtual('packageDetails', {
  ref: 'Package',
  localField: 'package',
  foreignField: '_id',
  justOne: true
});

// Virtual cho utilities (nếu cần chi tiết)
PostSchema.virtual('utilityDetails', {
  ref: 'Utilities',
  localField: 'utilities',
  foreignField: '_id'
});
module.exports = mongoose.model("Post", PostSchema);
