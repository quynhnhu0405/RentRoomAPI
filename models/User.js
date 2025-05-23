const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} không phải là email hợp lệ!`
        }
    },
    password: { type: String, required: true },
    createAt: { type: Date, required: true, default: Date.now },
    updateAt: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
    role: { type: String, enum: ["user", "admin"], default: "user"},
    avatar: { type: String, required: false },
    failedLoginAttempts: { type: Number, default: 0 }
});

module.exports = mongoose.model("User", UserSchema);
