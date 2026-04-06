const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  rank: { type: Number, required: true },
  correctAns: { type: Number, default: 0 },
  wrongAns: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('GameResult', gameResultSchema);
