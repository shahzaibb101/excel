const mongoose = require('mongoose');

// Define the schema for phone numbers
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
});

// Create a model using the schema
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
