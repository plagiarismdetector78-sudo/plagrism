// check-interview-data.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkData() {
  try {
    console.log('🔍 Checking scheduled_interviews data...\n');
    
    const interviews = await pool.query(`
      SELECT id, candidate_id, interviewer_id, meeting_room_id, 
             full_name, email, status, 
             LENGTH(transcript) as transcript_length
      FROM scheduled_interviews 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📋 Recent scheduled_interviews:');
    console.table(interviews.rows);
    
    console.log('\n🔍 Checking interview_reports data...\n');
    
    const reports = await pool.query(`
      SELECT id, interview_id, candidate_id, candidate_name, candidate_email,
             room_id, LENGTH(full_transcript) as transcript_length,
             created_at
      FROM interview_reports 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📊 Recent interview_reports:');
    console.table(reports.rows);
    
    // Check for matching room IDs
    console.log('\n🔗 Checking room ID matches...\n');
    const matches = await pool.query(`
      SELECT 
        si.id as scheduled_id,
        si.meeting_room_id,
        si.candidate_id as si_candidate_id,
        si.full_name,
        si.email,
        ir.id as report_id,
        ir.interview_id,
        ir.candidate_id as ir_candidate_id,
        ir.candidate_name,
        ir.candidate_email
      FROM scheduled_interviews si
      LEFT JOIN interview_reports ir ON si.meeting_room_id = ir.room_id
      ORDER BY si.created_at DESC
      LIMIT 5
    `);
    
    console.log('🔗 Scheduled Interviews <-> Reports matches:');
    console.table(matches.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkData();
