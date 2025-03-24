const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String },
  phoneNumber: { type: String },
  state: { type: String },
  zipCode: { type: String },
  email: { type: String, required: true, unique: true },
  gender: { type: String },
  userType: { type: String },
});

module.exports = mongoose.model("User", userSchema);
