const mongoose = require('mongoose');

const ChoiceSchema = new mongoose.Schema({
  chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  choice_text: { type: String, required: true },
  next_chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  order_number: { type: Number, default: 0 }
});

module.exports = mongoose.model('Choice', ChoiceSchema);
