// pages/api/verify-report-integrity.js
import { query } from "../../lib/db";
import { computeContentHash, computeBlockHash } from "../../lib/blockchain";
import { ensureReportSchemaReady } from "../../lib/ensureReportSchema";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await ensureReportSchemaReady();

    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ success: false, message: "reportId is required" });
    }

    const result = await query(
      `SELECT
         ir.id, ir.created_at, ir.updated_at, ir.block_id,
         ir.interview_id, ir.interviewer_id, ir.candidate_id,
         ir.interviewer_name, ir.candidate_name,
         ir.interviewer_email, ir.candidate_email,
         ir.question_category, ir.room_id, ir.duration, ir.report_type,
         bl.id            AS ledger_id,
         bl.block_index   AS bl_block_index,
         bl.report_id     AS bl_report_id,
         bl.content_hash  AS bl_content_hash,
         bl.previous_hash AS bl_previous_hash,
         bl.block_hash    AS bl_block_hash,
         bl.created_at    AS bl_created_at
       FROM interview_reports ir
       LEFT JOIN blockchain_ledger bl ON bl.id = ir.block_id
       WHERE ir.id = $1`,
      [reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const row = result.rows[0];

    let blockCheck = { valid: false, reason: "No blockchain block linked to this report" };
    let tamperDetail = null;

    if (row.ledger_id) {
      // ── 1. Recompute content hash from the CURRENT live report data ───────────
      // If anyone changed interviewer_name, candidate_name, room_id, etc. in the DB,
      // this recomputed hash will differ from what was sealed in the block at save time.
      const liveContentHash = computeContentHash({
        interview_id:      row.interview_id,
        interviewer_id:    row.interviewer_id,
        candidate_id:      row.candidate_id,
        interviewer_name:  row.interviewer_name,
        candidate_name:    row.candidate_name,
        interviewer_email: row.interviewer_email,
        candidate_email:   row.candidate_email,
        question_category: row.question_category,
        room_id:           row.room_id,
        duration:          row.duration,
        report_type:       row.report_type,
        created_at:        row.created_at,
      });

      const contentTampered = liveContentHash !== row.bl_content_hash;

      // ── 2. Recompute block hash from the CURRENT blockchain_ledger row ────────
      // If anyone changed the block's own fields, this will differ from bl_block_hash.
      const blCreatedAtStr = row.bl_created_at instanceof Date
        ? row.bl_created_at.toISOString()
        : String(row.bl_created_at);

      const recomputedBlockHash = computeBlockHash({
        block_index:   row.bl_block_index,
        report_id:     row.bl_report_id,
        content_hash:  row.bl_content_hash,  // use what's in the block
        previous_hash: row.bl_previous_hash,
        created_at:    blCreatedAtStr,
      });

      const blockTampered = recomputedBlockHash !== row.bl_block_hash;

      if (contentTampered) {
        tamperDetail = "Report data has been modified after sealing";
        blockCheck = { valid: false, reason: tamperDetail };
      } else if (blockTampered) {
        tamperDetail = "Blockchain block entry has been tampered with";
        blockCheck = { valid: false, reason: tamperDetail };
      } else {
        blockCheck = { valid: true, reason: "Block hash verified — report is authentic" };
      }
    }

    const createdAtStr = row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at;

    return res.status(200).json({
      success: true,
      reportId:  row.id,
      intact:    blockCheck.valid,
      verdict:   blockCheck.valid
        ? "✅ Report is authentic and untampered"
        : "🚨 Tampering detected — " + (tamperDetail || blockCheck.reason),
      timestamp: createdAtStr,
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
      blockchain: {
        blockIndex:   row.bl_block_index   ?? null,
        blockHash:    row.bl_block_hash    ?? null,
        previousHash: row.bl_previous_hash ?? null,
        valid:        blockCheck.valid,
        reason:       blockCheck.reason,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying report integrity:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify integrity",
      error: error.message,
    });
  }
}
