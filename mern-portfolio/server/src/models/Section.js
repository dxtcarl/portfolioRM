const { Schema, model } = require('mongoose');

const sectionSchema = new Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' }
}, { timestamps: true });

module.exports = model('Section', sectionSchema);
