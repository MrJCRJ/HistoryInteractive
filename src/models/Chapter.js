const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  story_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
  chapter_number: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  is_ending: { type: Boolean, default: false },
  date_created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chapter', ChapterSchema);
