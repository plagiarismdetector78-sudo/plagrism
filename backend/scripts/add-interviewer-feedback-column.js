// add-interviewer-feedback-column.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function addFeedbackColumn() {
  try {
    console.log('🔧 Adding interviewer_feedback column to scheduled_interviews table...');
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_interviews' 
      AND column_name = 'interviewer_feedback'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ interviewer_feedback column already exists');
      return;
    }
    
    // Add interviewer_feedback column (TEXT to store feedback)
    await pool.query(`
      ALTER TABLE scheduled_interviews 
      ADD COLUMN interviewer_feedback TEXT
    `);
    
    console.log('✅ Successfully added interviewer_feedback column');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addFeedbackColumn()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
