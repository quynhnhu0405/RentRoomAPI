const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    priceday: { type: Number, required: true },
    priceweek: { type: Number, required: true },
    pricemonth: { type: Number, required: true },
    level: { type: Number, required: true },
}); 

module.exports = mongoose.model("Package", packageSchema);