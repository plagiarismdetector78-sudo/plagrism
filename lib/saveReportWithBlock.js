// lib/saveReportWithBlock.js
import { withTransaction } from "./db";
import { computeBlockHash } from "./blockchain";
import { ensureReportSchemaReady } from "./ensureReportSchema";

export async function saveReportWithBlock(fields) {
  await ensureReportSchemaReady();

  return withTransaction(async (client) => {
    const createdAt = new Date().toISOString();

    const questionsAskedStr =
      fields.questions_asked == null ? null
      : typeof fields.questions_asked === "string" ? fields.questions_asked
      : JSON.stringify(fields.questions_asked);

    const evaluationDataStr =
      fields.evaluation_data == null ? null
      : typeof fields.evaluation_data === "string" ? fields.evaluation_data
      : JSON.stringify(fields.evaluation_data);

    const reportDataObj =
      fields.report_data == null ? null
      : typeof fields.report_data === "string" ? JSON.parse(fields.report_data)
      : fields.report_data;

    // ── Insert report row ──────────────────────────────────────────────────────
    const reportResult = await client.query(
      `INSERT INTO interview_reports
         (interview_id, interviewer_id, candidate_id,
          interviewer_name, candidate_name, interviewer_email, candidate_email,
          question_category, questions_asked, full_transcript,
          evaluation_data, room_id, duration, report_type, report_data,
          user_id, time_range_start, time_range_end,
          created_at, updated_at)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19,$19)
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
        questionsAskedStr,
        fields.full_transcript   ?? null,
        evaluationDataStr,
        fields.room_id           ?? null,
        fields.duration          ?? null,
        fields.report_type       ?? "interview",
        reportDataObj ? JSON.stringify(reportDataObj) : null,
        fields.user_id           ?? null,
        fields.time_range_start  ?? null,
        fields.time_range_end    ?? null,
        createdAt,
      ]
    );

    const reportId = reportResult.rows[0].id;

    // ── Get last block to chain from ───────────────────────────────────────────
    const lastBlock = await client.query(
      `SELECT block_index, block_hash FROM blockchain_ledger ORDER BY block_index DESC LIMIT 1`
    );

    const previousHash = lastBlock.rows.length > 0 ? lastBlock.rows[0].block_hash : "0".repeat(64);
    const blockIndex   = lastBlock.rows.length > 0 ? lastBlock.rows[0].block_index + 1 : 0;

    // ── Compute and insert block ───────────────────────────────────────────────
    const blockHash = computeBlockHash({
      block_index:   blockIndex,
      report_id:     reportId,
      previous_hash: previousHash,
      created_at:    createdAt,
    });

    const blockResult = await client.query(
      `INSERT INTO blockchain_ledger
         (block_index, report_id, previous_hash, block_hash, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [blockIndex, reportId, previousHash, blockHash, createdAt]
    );

    const blockId = blockResult.rows[0].id;

    // ── Back-link report → block ───────────────────────────────────────────────
    await client.query(
      `UPDATE interview_reports SET block_id = $1 WHERE id = $2`,
      [blockId, reportId]
    );

    return { reportId, blockIndex, blockId, blockHash, createdAt };
  });
}
