require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Question = require('./models/Question');

const categories = [
  { name: 'JavaScript', slug: 'javascript', icon: 'JS', color: '#f7df1e' },
  { name: 'React', slug: 'react', icon: 'React', color: '#61dafb' },
  { name: 'Node.js', slug: 'node', icon: 'Node.js', color: '#339933' },
  { name: 'General Tech', slug: 'general', icon: 'Tech', color: '#8884d8' }
];

const difficulties = ['EASY', 'MEDIUM', 'HARD'];

const generateQuestions = (catId, count) => {
  const qs = [];
  for (let i = 1; i <= count; i++) {
    qs.push({
      categoryId: catId,
      subTopic: 'Basics',
      questionText: `Sample question ${i} for this category?`,
      difficulty: difficulties[Math.floor(Math.random() * 2)], // Mostly EASY and MEDIUM
      type: 'MULTIPLE_CHOICE',
      explanation: 'Detailed explanation for this question.',
      options: [
        { optionText: 'Option A (Correct)', isCorrect: true },
        { optionText: 'Option B', isCorrect: false },
        { optionText: 'Option C', isCorrect: false },
        { optionText: 'Option D', isCorrect: false }
      ]
    });
  }
  return qs;
};

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('📡 Connected for expanded seeding...');

    await Category.deleteMany({});
    await Question.deleteMany({});

    const seededCats = await Category.insertMany(categories);
    console.log(`✅ Seeded ${seededCats.length} categories.`);

    let qCount = 0;
    for (const cat of seededCats) {
      const qs = generateQuestions(cat._id, 15); // 15 questions per category
      await Question.insertMany(qs);
      qCount += qs.length;
    }

    console.log(`✅ Seeded ${qCount} questions total.`);
    console.log('🚀 Seeding complete! Try creating a room now.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
