const mongoose = require('mongoose');

// Define the schema for phone numbers
const mainTextSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  subheading: { type: String, required: true }
});

// Create a model using the schema
const MainText = mongoose.model('MainText', mainTextSchema);

module.exports = MainText;
