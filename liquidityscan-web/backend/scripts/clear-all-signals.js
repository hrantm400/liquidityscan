// Simple script to clear all signals from database
// Run with: node scripts/clear-all-signals.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllSignals() {
  try {
    console.log('🗑️  Clearing all signals from database...');
    
    const result = await prisma.signal.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} signals`);
    console.log('Database is now clean and ready for new signal logic!');
  } catch (error) {
    console.error('❌ Error clearing signals:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSignals();
