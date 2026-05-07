// lib/ensureReportSchema.js
import { query } from "./db";

let initialized = false;

export async function dropAndRecreateReportSchema() {
  await query(`DROP TABLE IF EXISTS blockchain_ledger CASCADE`);
  await query(`DROP TABLE IF EXISTS interview_reports CASCADE`);

  await query(`
    CREATE TABLE interview_reports (
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
      block_id           INTEGER,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // content_hash lives in the ledger — it's the hash of the report's simple fields
  // baked into the block at save time. Changing any of those fields in interview_reports
  // will cause the recomputed content_hash to differ from what's stored in the block.
  await query(`
    CREATE TABLE blockchain_ledger (
      id             SERIAL PRIMARY KEY,
      block_index    INTEGER NOT NULL UNIQUE,
      report_id      INTEGER NOT NULL,
      content_hash   CHAR(64) NOT NULL,
      previous_hash  CHAR(64) NOT NULL,
      block_hash     CHAR(64) NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`CREATE INDEX idx_ir_interview_id ON interview_reports(interview_id)`);
  await query(`CREATE INDEX idx_ir_room_id      ON interview_reports(room_id)`);
  await query(`CREATE INDEX idx_ir_interviewer  ON interview_reports(interviewer_id)`);
  await query(`CREATE INDEX idx_ir_candidate    ON interview_reports(candidate_id)`);
  await query(`CREATE INDEX idx_bl_report_id    ON blockchain_ledger(report_id)`);

  initialized = true;
  console.log("✅ interview_reports + blockchain_ledger recreated");
}

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
      content_hash   CHAR(64) NOT NULL DEFAULT '',
      previous_hash  CHAR(64) NOT NULL,
      block_hash     CHAR(64) NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Add content_hash column if upgrading from old schema without it
  await query(`ALTER TABLE blockchain_ledger ADD COLUMN IF NOT EXISTS content_hash CHAR(64) NOT NULL DEFAULT ''`);

  initialized = true;
}
