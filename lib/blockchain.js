// lib/blockchain.js
// Off-chain blockchain for interview report integrity
// Each report gets a SHA-256 content hash + a blockchain block that chains to the previous block.
// Tampering with any report data breaks its hash, and tampering with any block breaks every block after it.

import crypto from "crypto";

/**
 * Build a deterministic JSON string from report fields.
 * Only canonical fields are included so that non-content columns (e.g. block_id) don't affect the hash.
 */
export function buildReportPayload(fields) {
  return JSON.stringify({
    interview_id:      fields.interview_id      ?? null,
    interviewer_id:    fields.interviewer_id    ?? null,
    candidate_id:      fields.candidate_id      ?? null,
    interviewer_name:  fields.interviewer_name  ?? null,
    candidate_name:    fields.candidate_name    ?? null,
    interviewer_email: fields.interviewer_email ?? null,
    candidate_email:   fields.candidate_email   ?? null,
    question_category: fields.question_category ?? null,
    questions_asked:   fields.questions_asked   ?? null,
    full_transcript:   fields.full_transcript   ?? null,
    evaluation_data:   fields.evaluation_data   ?? null,
    room_id:           fields.room_id           ?? null,
    duration:          fields.duration          ?? null,
    report_type:       fields.report_type       ?? null,
    report_data:       fields.report_data       ?? null,
    created_at:        fields.created_at        ?? null,   // timestamp locked into hash
  });
}

/**
 * SHA-256 hash of a string. Returns hex string.
 */
export function sha256(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Compute the content hash for a report row.
 */
export function computeContentHash(fields) {
  return sha256(buildReportPayload(fields));
}

/**
 * Compute a block hash from its own fields.
 * block_hash = SHA256(block_index + report_id + content_hash + previous_hash + timestamp)
 */
export function computeBlockHash({ block_index, report_id, content_hash, previous_hash, created_at }) {
  const data = `${block_index}|${report_id}|${content_hash}|${previous_hash}|${created_at}`;
  return sha256(data);
}

/**
 * Verify a single report row against its stored content_hash.
 * Returns { valid: bool, reason: string }
 */
export function verifyContentHash(row) {
  const expected = computeContentHash({
    interview_id:      row.interview_id,
    interviewer_id:    row.interviewer_id,
    candidate_id:      row.candidate_id,
    interviewer_name:  row.interviewer_name,
    candidate_name:    row.candidate_name,
    interviewer_email: row.interviewer_email,
    candidate_email:   row.candidate_email,
    question_category: row.question_category,
    questions_asked:   row.questions_asked,
    full_transcript:   row.full_transcript,
    evaluation_data:   row.evaluation_data,
    room_id:           row.room_id,
    duration:          row.duration,
    report_type:       row.report_type,
    report_data:       row.report_data,
    created_at:        row.created_at,
  });

  if (expected !== row.content_hash) {
    return { valid: false, reason: "Content hash mismatch — report data has been tampered with" };
  }
  return { valid: true, reason: "Content hash verified" };
}

/**
 * Verify a blockchain block's own hash.
 * Returns { valid: bool, reason: string }
 */
export function verifyBlockHash(block) {
  const expected = computeBlockHash({
    block_index:   block.block_index,
    report_id:     block.report_id,
    content_hash:  block.content_hash,
    previous_hash: block.previous_hash,
    created_at:    block.created_at,
  });

  if (expected !== block.block_hash) {
    return { valid: false, reason: "Block hash mismatch — blockchain entry has been tampered with" };
  }
  return { valid: true, reason: "Block hash verified" };
}
