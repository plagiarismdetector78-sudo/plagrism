// lib/blockchain.js
import crypto from "crypto";

export function sha256(data) {
  return crypto.createHash("sha256").update(String(data), "utf8").digest("hex");
}

/**
 * Normalize any date value to a consistent UTC string.
 * Postgres Date objects, ISO strings, and pg timestamp strings all normalize the same way.
 * We use epoch milliseconds as the canonical form — no string formatting ambiguity.
 */
export function normalizeDate(v) {
  if (v == null) return "0";
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? String(v) : String(d.getTime());
}

/**
 * Build a stable content fingerprint from report fields.
 * Only TEXT/simple columns — never JSONB.
 * Pipe-delimited.
 */
export function buildContentFingerprint(row) {
  const s = (v) => (v == null ? "" : String(v).trim());
  return [
    s(row.interview_id),
    s(row.interviewer_id),
    s(row.candidate_id),
    s(row.interviewer_name),
    s(row.candidate_name),
    s(row.interviewer_email),
    s(row.candidate_email),
    s(row.question_category),
    s(row.room_id),
    s(row.duration),
    s(row.report_type),
    normalizeDate(row.created_at),   // epoch ms — identical regardless of how Postgres returns it
  ].join("|");
}

export function computeContentHash(row) {
  return sha256(buildContentFingerprint(row));
}

/**
 * Block hash = SHA256("blockIndex|reportId|contentHash|previousHash|createdAtMs")
 */
export function computeBlockHash({ block_index, report_id, content_hash, previous_hash, created_at }) {
  const ts = normalizeDate(created_at);
  return sha256(`${block_index}|${report_id}|${content_hash}|${previous_hash}|${ts}`);
}

export function verifyBlockHash(block) {
  const expected = computeBlockHash({
    block_index:   block.block_index,
    report_id:     block.report_id,
    content_hash:  block.content_hash,
    previous_hash: block.previous_hash,
    created_at:    block.created_at,
  });
  if (expected !== block.block_hash) {
    return { valid: false, reason: "Block hash mismatch — report or blockchain entry has been tampered with" };
  }
  return { valid: true, reason: "Block hash verified" };
}
