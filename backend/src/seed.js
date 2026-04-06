require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Question = require('./models/Question');

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('📡 Connected to database.');

    // Remove all global categories (ones that don't belong to a specific user)
    const result = await Category.deleteMany({
      $or: [
        { createdBy: null },
        { createdBy: { $exists: false } }
      ]
    });
    
    console.log(`✅ Wiped ${result.deletedCount} global default categories to strictly enforce User Isolation.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
