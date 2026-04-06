const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getQuestionsForRoom(categoryId, difficulty, count) {
  const questions = await prisma.question.findMany({
    where: { categoryId, difficulty, isActive: true },
    include: { options: true },
  });

  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, Math.min(count, questions.length));
}

module.exports = { getQuestionsForRoom, prisma };
