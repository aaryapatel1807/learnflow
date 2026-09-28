/**
 * Safe additive content seeder.
 *
 * Adds the real content pack (books, chapters, quizzes, flashcards,
 * learning paths) WITHOUT deleting anything. Idempotent — safe to run
 * multiple times and safe to run against a database that already has
 * users and progress data.
 *
 * Usage:  npm run seed:content
 *         MONGODB_URI=mongodb://localhost:27017/learnflow node seed-content.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { seedRealContent } = require('./seed-data/realContent');

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set. Add it to server/.env or export it first.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB (nothing will be deleted)');

    const counts = await seedRealContent();

    console.log('\n✅ Content seeding complete:');
    for (const [key, value] of Object.entries(counts)) {
      console.log(`   ${key}: +${value}`);
    }
    console.log('\n(Items already present were skipped — run again any time.)');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

run();
