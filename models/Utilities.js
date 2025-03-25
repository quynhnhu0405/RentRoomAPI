const mongoose = require("mongoose");

const UtilitiesSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

module.exports = mongoose.model("Utilities", UtilitiesSchema);
