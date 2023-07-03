/** @format */

const mongoose = require("mongoose");

const DocSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("doc", DocSchema);
