const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    createAt: { type: Date, required: true, default: Date.now },
}); 

module.exports = mongoose.model("Category", CategorySchema);