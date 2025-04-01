const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    PostId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "waiting" },
},{ timestamps: true } ); 

module.exports = mongoose.model("Package", paymentSchema);