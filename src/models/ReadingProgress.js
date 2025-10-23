const mongoose = require('mongoose');

const ReadingProgressSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  story_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
  current_chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  last_read: { type: Date, default: Date.now }
});

// Índices únicos
ReadingProgressSchema.index({ session_id: 1, story_id: 1 }, { unique: true });

module.exports = mongoose.model('ReadingProgress', ReadingProgressSchema);
