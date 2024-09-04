const mongoose = require('mongoose');

// Define the schema for phone numbers
const phoneNumberSchema = new mongoose.Schema({
  phone: { type: String, required: true }
}, { collection: 'mobile_numbers' }); // Explicitly specify the collection name

// Create a model using the schema
const PhoneNumber = mongoose.model('PhoneNumber', phoneNumberSchema);

module.exports = PhoneNumber;
