const { Pool } = require('pg');
require('dotenv').config();

// Use direct SQL query to avoid Prisma adapter issues
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_POOL_URL,
});

async function clearAllSignals() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    
    console.log('Counting existing signals...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM signals');
    const count = parseInt(countResult.rows[0].count);
    console.log(`Found ${count} signals to delete`);
    
    if (count === 0) {
      console.log('No signals to delete. Database is already clean.');
      return;
    }
    
    console.log('Deleting all signals...');
    // Delete all signals (SignalAlert will be deleted automatically due to cascade)
    await client.query('DELETE FROM signals');
    
    console.log(`✅ Successfully deleted ${count} signals`);
    console.log('Database cleared. New signals will be generated with correct logic.');
  } catch (error) {
    console.error('❌ Error clearing signals:', error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
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
