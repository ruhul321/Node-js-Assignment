// models/Policy.js
const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  policyNumber: { type: String, required: true },
  policyStartDate: { type: Date, required: true },
  policyEndDate: { type: Date, required: true },
  policyCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LOB",
    required: true,
  },
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Carrier",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
});

module.exports = mongoose.model("Policy", policySchema);
