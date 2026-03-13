const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    // ✅ ADDED — which carousel section this photo belongs to
    section: {
      type: String,
      enum: ['section1', 'section2', 'section3', 'section4'],
      default: 'section1',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Photo', photoSchema);