// pages/api/verify-report-integrity.js
import { query } from "../../lib/db";
import { computeBlockHash } from "../../lib/blockchain";
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
         bl.id            AS ledger_id,
         bl.block_index   AS bl_block_index,
         bl.report_id     AS bl_report_id,
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

    // ── Verify block hash ──────────────────────────────────────────────────────
    let blockCheck = { valid: false, reason: "No blockchain block linked to this report" };

    if (row.ledger_id) {
      const blCreatedAtStr = row.bl_created_at instanceof Date
        ? row.bl_created_at.toISOString()
        : String(row.bl_created_at);

      const recomputed = computeBlockHash({
        block_index:   row.bl_block_index,
        report_id:     row.bl_report_id,
        previous_hash: row.bl_previous_hash,
        created_at:    blCreatedAtStr,
      });

      const valid = recomputed === row.bl_block_hash;
      blockCheck = {
        valid,
        reason: valid ? "Block hash verified" : "Block hash mismatch — blockchain entry has been tampered with",
      };
    }

    const createdAtStr = row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at;

    return res.status(200).json({
      success: true,
      reportId:  row.id,
      intact:    blockCheck.valid,
      verdict:   blockCheck.valid
        ? "✅ Report blockchain entry is authentic and untampered"
        : "🚨 Blockchain integrity violation detected",
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
