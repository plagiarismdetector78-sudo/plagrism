// lib/saveReportWithBlock.js
// Shared helper used by save-interview-report and generate-report.
// Inserts a report row + a blockchain block in a single transaction.

import { withTransaction } from "./db";
import { computeContentHash, computeBlockHash } from "./blockchain";
import { ensureReportSchemaReady } from "./ensureReportSchema";

/**
 * Insert a report and its blockchain block atomically.
 *
 * @param {object} fields - All report column values (excluding id, content_hash, block_id, created_at)
 * @returns {Promise<{ reportId: number, blockIndex: number, contentHash: string, blockHash: string, createdAt: string }>}
 */
export async function saveReportWithBlock(fields) {
  await ensureReportSchemaReady();

  return withTransaction(async (client) => {
    // ── 1. Determine created_at now so it's locked into the hash ──────────────
    const createdAt = new Date().toISOString();

    // ── 2. Compute content hash ────────────────────────────────────────────────
    const contentHash = computeContentHash({ ...fields, created_at: createdAt });

    // ── 3. Insert the report row ───────────────────────────────────────────────
    const reportResult = await client.query(
      `INSERT INTO interview_reports
         (interview_id, interviewer_id, candidate_id,
          interviewer_name, candidate_name, interviewer_email, candidate_email,
          question_category, questions_asked, full_transcript,
          evaluation_data, room_id, duration, report_type, report_data,
          user_id, time_range_start, time_range_end,
          content_hash, created_at, updated_at)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$20)
       RETURNING id`,
      [
        fields.interview_id      ?? null,
        fields.interviewer_id    ?? null,
        fields.candidate_id      ?? null,
        fields.interviewer_name  ?? null,
        fields.candidate_name    ?? null,
        fields.interviewer_email ?? null,
        fields.candidate_email   ?? null,
        fields.question_category ?? null,
        fields.questions_asked   ?? null,
        fields.full_transcript   ?? null,
        fields.evaluation_data   ?? null,
        fields.room_id           ?? null,
        fields.duration          ?? null,
        fields.report_type       ?? "interview",
        fields.report_data       ? JSON.stringify(fields.report_data) : null,
        fields.user_id           ?? null,
        fields.time_range_start  ?? null,
        fields.time_range_end    ?? null,
        contentHash,
        createdAt,
      ]
    );

    const reportId = reportResult.rows[0].id;

    // ── 4. Get the last block to chain from ────────────────────────────────────
    const lastBlock = await client.query(
      `SELECT block_index, block_hash FROM blockchain_ledger ORDER BY block_index DESC LIMIT 1`
    );

    const previousHash  = lastBlock.rows.length > 0 ? lastBlock.rows[0].block_hash : "0".repeat(64);
    const blockIndex    = lastBlock.rows.length > 0 ? lastBlock.rows[0].block_index + 1 : 0;
    const blockCreatedAt = createdAt;

    // ── 5. Compute block hash ──────────────────────────────────────────────────
    const blockHash = computeBlockHash({
      block_index:   blockIndex,
      report_id:     reportId,
      content_hash:  contentHash,
      previous_hash: previousHash,
      created_at:    blockCreatedAt,
    });

    // ── 6. Insert the block ────────────────────────────────────────────────────
    const blockResult = await client.query(
      `INSERT INTO blockchain_ledger
         (block_index, report_id, content_hash, previous_hash, block_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [blockIndex, reportId, contentHash, previousHash, blockHash, blockCreatedAt]
    );

    const blockId = blockResult.rows[0].id;

    // ── 7. Back-link the report to its block ───────────────────────────────────
    await client.query(
      `UPDATE interview_reports SET block_id = $1 WHERE id = $2`,
      [blockId, reportId]
    );

    return { reportId, blockIndex, blockId, contentHash, blockHash, createdAt };
  });
}
