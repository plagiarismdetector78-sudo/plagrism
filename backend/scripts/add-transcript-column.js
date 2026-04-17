// add-transcript-column.js
// Run this script to add transcript column to scheduled_interviews table
// Usage: node add-transcript-column.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function addTranscriptColumn() {
  try {
    console.log('🔧 Adding transcript column to scheduled_interviews table...');
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_interviews' 
      AND column_name = 'transcript'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ transcript column already exists');
      return;
    }
    
    // Add transcript column
    await pool.query(`
      ALTER TABLE scheduled_interviews 
      ADD COLUMN transcript TEXT
    `);
    
    console.log('✅ Successfully added transcript column to scheduled_interviews table');
    
    // Show table structure
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_interviews'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 scheduled_interviews table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error adding transcript column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addTranscriptColumn()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
