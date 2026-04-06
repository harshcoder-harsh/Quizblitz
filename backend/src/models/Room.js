const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  status: { type: String, enum: ['WAITING', 'ACTIVE', 'FINISHED'], default: 'WAITING' },
  maxPlayers: { type: Number, default: 10 },
  timerSeconds: { type: Number, default: 20 },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
  questionCount: { type: Number, default: 10 },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Room', roomSchema);
