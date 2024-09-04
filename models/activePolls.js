const mongoose = require('mongoose');

const activePollsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  option1: {
    type: String,
    required: true,
  },
  option2: {
    type: String,
    required: true,
  },
  option3: {
    type: String,
    required: true,
  },
  votes1: {
    type: Number,
    default: 0, // Track votes for option1
  },
  votes2: {
    type: Number,
    default: 0, // Track votes for option2
  },
  votes3: {
    type: Number,
    default: 0, // Track votes for option3
  },
  completed: {
    type: Boolean,
    default: false, // Poll is active by default
  }
}, {
  timestamps: true,
});

const ActivePolls = mongoose.model('ActivePolls', activePollsSchema);

module.exports = ActivePolls;
