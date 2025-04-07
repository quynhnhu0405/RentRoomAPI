const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createAt: { type: Date, required: true, default: Date.now },
    updateAt: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
    role: { type: String, enum: ["user", "admin"], default: "user"},
    avatar: { type: String, required: false },
});

module.exports = mongoose.model("User", UserSchema);
