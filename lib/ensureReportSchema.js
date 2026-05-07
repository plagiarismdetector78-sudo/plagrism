// lib/ensureReportSchema.js
// Drops and recreates interview_reports with integrity columns,
// and creates the blockchain_ledger table.
// Called once at startup via the init API route.
// All other APIs call ensureReportSchemaReady() which is a no-op after first run.

import { query } from "./db";

let initialized = false;

export async function dropAndRecreateReportSchema() {
  // ── 1. Drop existing tables (fresh start) ──────────────────────────────────
  await query(`DROP TABLE IF EXISTS blockchain_ledger CASCADE`);
  await query(`DROP TABLE IF EXISTS interview_reports CASCADE`);

  // ── 2. Recreate interview_reports with integrity columns ───────────────────
  await query(`
    CREATE TABLE interview_reports (
      id                 SERIAL PRIMARY KEY,

      -- participants
      interview_id       TEXT,
      interviewer_id     TEXT,
      candidate_id       TEXT,
      interviewer_name   TEXT,
      candidate_name     TEXT,
      interviewer_email  TEXT,
      candidate_email    TEXT,

      -- content
      question_category  TEXT,
      questions_asked    TEXT,
      full_transcript    TEXT,
      evaluation_data    TEXT,
      room_id            TEXT,
      duration           TEXT,
      report_type        TEXT DEFAULT 'interview',
      report_data        JSONB,

      -- legacy generate-report fields
      user_id            TEXT,
      time_range_start   TIMESTAMPTZ,
      time_range_end     TIMESTAMPTZ,

      -- integrity
      content_hash       CHAR(64) NOT NULL,   -- SHA-256 of canonical report fields
      block_id           INTEGER,             -- FK to blockchain_ledger (set after block insert)

      -- timestamp (locked into hash)
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── 3. Create blockchain_ledger ────────────────────────────────────────────
  await query(`
    CREATE TABLE blockchain_ledger (
      id             SERIAL PRIMARY KEY,
      block_index    INTEGER NOT NULL UNIQUE,   -- sequential chain position
      report_id      INTEGER NOT NULL,          -- FK to interview_reports.id
      content_hash   CHAR(64) NOT NULL,         -- copy of report's content_hash
      previous_hash  CHAR(64) NOT NULL,         -- previous block's block_hash (or '0' for genesis)
      block_hash     CHAR(64) NOT NULL,         -- SHA-256(block_index|report_id|content_hash|previous_hash|created_at)
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── 4. Index for fast lookups ──────────────────────────────────────────────
  await query(`CREATE INDEX idx_ir_interview_id  ON interview_reports(interview_id)`);
  await query(`CREATE INDEX idx_ir_room_id       ON interview_reports(room_id)`);
  await query(`CREATE INDEX idx_ir_interviewer   ON interview_reports(interviewer_id)`);
  await query(`CREATE INDEX idx_ir_candidate     ON interview_reports(candidate_id)`);
  await query(`CREATE INDEX idx_bl_report_id     ON blockchain_ledger(report_id)`);

  initialized = true;
  console.log("✅ interview_reports + blockchain_ledger schema created fresh");
}

/**
 * Ensures the schema exists without dropping.
 * Safe to call on every request — uses CREATE TABLE IF NOT EXISTS.
 * Call dropAndRecreateReportSchema() once from the init route for a fresh start.
 */
export async function ensureReportSchemaReady() {
  if (initialized) return;

  await query(`
    CREATE TABLE IF NOT EXISTS interview_reports (
      id                 SERIAL PRIMARY KEY,
      interview_id       TEXT,
      interviewer_id     TEXT,
      candidate_id       TEXT,
      interviewer_name   TEXT,
      candidate_name     TEXT,
      interviewer_email  TEXT,
      candidate_email    TEXT,
      question_category  TEXT,
      questions_asked    TEXT,
      full_transcript    TEXT,
      evaluation_data    TEXT,
      room_id            TEXT,
      duration           TEXT,
      report_type        TEXT DEFAULT 'interview',
      report_data        JSONB,
      user_id            TEXT,
      time_range_start   TIMESTAMPTZ,
      time_range_end     TIMESTAMPTZ,
      content_hash       CHAR(64) NOT NULL DEFAULT '',
      block_id           INTEGER,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS blockchain_ledger (
      id             SERIAL PRIMARY KEY,
      block_index    INTEGER NOT NULL UNIQUE,
      report_id      INTEGER NOT NULL,
      content_hash   CHAR(64) NOT NULL,
      previous_hash  CHAR(64) NOT NULL,
      block_hash     CHAR(64) NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  initialized = true;
}
