const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_oUfGV61JaLig@ep-patient-mud-adrgfjkf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_interviews' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n✅ Columns in scheduled_interviews table:\n');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
