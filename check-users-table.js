// check-users-table.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...\n');
    
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Users table columns:');
    console.table(columns.rows);
    
    // Check sample data
    const sample = await pool.query(`SELECT * FROM users LIMIT 2`);
    console.log('\n📋 Sample users data:');
    console.table(sample.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
