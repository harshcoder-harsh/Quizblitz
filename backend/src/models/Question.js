const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionText: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const questionSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subTopic: { type: String, required: true },
  questionText: { type: String, required: true },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], required: true },
  type: { type: String, enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'CODE_OUTPUT'], default: 'MULTIPLE_CHOICE' },
  explanation: { type: String, default: null },
  referenceUrl: { type: String, default: null },
  tags: { type: [String], default: [] },
  reportCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  options: [optionSchema],
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Question', questionSchema);
