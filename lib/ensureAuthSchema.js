import { query } from "./db";

/**
 * Ensures auth/admin related columns exist on `users`.
 * Safe to call on every request (idempotent).
 */
export async function ensureAuthSchema() {
  // Add approval flag for interviewer accounts
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
}

