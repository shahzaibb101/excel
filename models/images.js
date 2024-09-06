const mongoose = require('mongoose');

// Define the Images schema
const imagesSchema = new mongoose.Schema({
  img1: {
    type: String,
    required: true,
  },
  img2: {
    type: String,
    required: true,
  },
  img3: {
    type: String,
    required: true,
  }
});

const Images = mongoose.model('Images', imagesSchema);

module.exports = Images;
