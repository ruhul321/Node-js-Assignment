const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
});

module.exports = mongoose.model("Account", accountSchema);
