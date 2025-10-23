const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  cover_color: { type: String, default: '#2d2d2d' },
  cover_image: String,
  genre: { type: String, default: 'Drama Real' },
  status: { type: String, default: 'Em andamento' },
  date_created: { type: Date, default: Date.now },
  date_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Story', StorySchema);
