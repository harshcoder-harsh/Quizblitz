require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Question = require('./models/Question');

const categories = [
  { name: 'JavaScript', slug: 'javascript', icon: 'JS', color: '#f7df1e' },
  { name: 'React', slug: 'react', icon: 'React', color: '#61dafb' },
  { name: 'Node.js', slug: 'node', icon: 'Node.js', color: '#339933' },
  { name: 'Python', slug: 'python', icon: 'Python', color: '#3776ab' }
];

const seedQuestions = [
  {
    categoryName: 'JavaScript',
    subTopic: 'Basics',
    questionText: 'What is the correct way to declare a constant in JavaScript?',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    explanation: 'const is used to declare variables that cannot be reassigned.',
    options: [
      { optionText: 'var', isCorrect: false },
      { optionText: 'let', isCorrect: false },
      { optionText: 'const', isCorrect: true },
      { optionText: 'constant', isCorrect: false }
    ]
  },
  {
    categoryName: 'React',
    subTopic: 'Hooks',
    questionText: 'Which hook would you use to perform a side effect in React?',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    explanation: 'useEffect is designed for synchronization and side effects.',
    options: [
      { optionText: 'useState', isCorrect: false },
      { optionText: 'useEffect', isCorrect: true },
      { optionText: 'useContext', isCorrect: false },
      { optionText: 'useMemo', isCorrect: false }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('📡 Connected to MongoDB for seeding...');

    // Clear existing
    await Category.deleteMany({});
    await Question.deleteMany({});

    // Seed Categories
    const seededCategories = await Category.insertMany(categories);
    console.log(`✅ Seeded ${seededCategories.length} categories.`);

    // Seed Questions
    for (const qData of seedQuestions) {
      const { categoryName, ...q } = qData;
      const cat = seededCategories.find(c => c.name === categoryName);
      if (cat) {
        await Question.create({ ...q, categoryId: cat._id });
      }
    }
    console.log(`✅ Seeded ${seedQuestions.length} questions.`);

    console.log('🚀 Seeding complete! Your app is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
