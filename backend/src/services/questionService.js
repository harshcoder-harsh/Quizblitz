const Question = require("../models/Question");

async function getQuestionsForRoom(categoryId, difficulty, count) {
  const questions = await Question.find({ 
    categoryId, 
    difficulty, 
    isActive: true 
  });

  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, Math.min(count, questions.length));
}

module.exports = { getQuestionsForRoom };
