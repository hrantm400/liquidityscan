import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL && !process.env.DATABASE_POOL_URL) {
  console.error('❌ DATABASE_URL or DATABASE_POOL_URL not found in environment variables');
  console.error(`Looking for .env file at: ${envPath}`);
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

// PrismaClient automatically uses DATABASE_URL from environment
const prisma = new PrismaClient();

async function clearAllSignals() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    console.log('Counting existing signals...');
    const count = await prisma.signal.count();
    console.log(`Found ${count} signals to delete`);
    
    if (count === 0) {
      console.log('No signals to delete. Database is already clean.');
      return;
    }
    
    console.log('Deleting all signals...');
    // Delete all signals (SignalAlert will be deleted automatically due to cascade)
    const result = await prisma.signal.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} signals`);
    console.log('Database cleared. New signals will be generated with correct logic.');
  } catch (error) {
    console.error('❌ Error clearing signals:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSignals()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
