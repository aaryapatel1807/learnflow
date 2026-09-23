const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  targetAudience: {
    type: String,
    default: ''
  },
  estimatedDuration: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
