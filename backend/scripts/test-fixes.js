// test-fixes.js - Run this to verify all fixes are working
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function testFixes() {
  console.log('🧪 Testing All Fixes...\n');
  
  try {
    // Test 1: Check scheduled_interviews has correct data
    console.log('1️⃣ Testing scheduled_interviews data...');
    const interviews = await pool.query(`
      SELECT id, candidate_id, interviewer_id, meeting_room_id, 
             full_name, email, position, status
      FROM scheduled_interviews 
      WHERE candidate_id IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    console.log('✅ Found', interviews.rows.length, 'interviews with candidate_id');
    console.table(interviews.rows);
    
    // Test 2: Check interview_reports has candidate info
    console.log('\n2️⃣ Testing interview_reports candidate data...');
    const reports = await pool.query(`
      SELECT id, interview_id, candidate_id, candidate_name, 
             candidate_email, room_id
      FROM interview_reports 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('Reports found:', reports.rows.length);
    console.table(reports.rows);
    
    const withCandidateInfo = reports.rows.filter(r => r.candidate_id && r.candidate_name !== 'Candidate');
    console.log('✅ Reports with proper candidate info:', withCandidateInfo.length);
    console.log('❌ Reports missing candidate info:', reports.rows.length - withCandidateInfo.length);
    
    // Test 3: Check room_id matches
    console.log('\n3️⃣ Testing room_id relationships...');
    const matches = await pool.query(`
      SELECT 
        si.id as scheduled_id,
        si.candidate_id,
        si.full_name,
        si.meeting_room_id,
        ir.id as report_id,
        ir.candidate_id as report_candidate_id,
        ir.candidate_name
      FROM scheduled_interviews si
      LEFT JOIN interview_reports ir ON si.meeting_room_id = ir.room_id
      WHERE si.candidate_id IS NOT NULL
      ORDER BY si.created_at DESC
      LIMIT 5
    `);
    console.table(matches.rows);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total scheduled interviews:', interviews.rows.length);
    console.log('Total interview reports:', reports.rows.length);
    console.log('Reports with candidate info:', withCandidateInfo.length);
    console.log('Reports missing candidate info:', reports.rows.length - withCandidateInfo.length);
    
    if (withCandidateInfo.length === reports.rows.length && reports.rows.length > 0) {
      console.log('\n✅ ALL REPORTS HAVE CANDIDATE INFO!');
    } else if (reports.rows.length === 0) {
      console.log('\n⚠️  No reports found. Create a new interview to test.');
    } else {
      console.log('\n⚠️  Some reports are missing candidate info.');
      console.log('   This is expected for old interviews created before the fix.');
      console.log('   New interviews will have proper candidate info.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testFixes();
