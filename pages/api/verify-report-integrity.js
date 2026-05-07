// pages/api/verify-report-integrity.js
// Verifies a report's content hash AND its blockchain block.
// Powers the "Integrity Check" button on the reports page.

import { query } from "../../lib/db";
import { verifyContentHash, verifyBlockHash } from "../../lib/blockchain";
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

    // ── Fetch report + its block ───────────────────────────────────────────────
    const result = await query(
      `SELECT
         ir.*,
         bl.id            AS ledger_id,
         bl.block_index,
         bl.previous_hash,
         bl.block_hash,
         bl.created_at    AS block_created_at
       FROM interview_reports ir
       LEFT JOIN blockchain_ledger bl ON bl.id = ir.block_id
       WHERE ir.id = $1`,
      [reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const row = result.rows[0];

    // ── 1. Verify content hash ─────────────────────────────────────────────────
    const contentCheck = verifyContentHash(row);

    // ── 2. Verify block hash ───────────────────────────────────────────────────
    let blockCheck = { valid: false, reason: "No blockchain block linked to this report" };
    if (row.ledger_id) {
      blockCheck = verifyBlockHash({
        block_index:   row.block_index,
        report_id:     row.id,
        content_hash:  row.content_hash,
        previous_hash: row.previous_hash,
        block_hash:    row.block_hash,
        created_at:    row.block_created_at,
      });
    }

    // ── 3. Overall verdict ─────────────────────────────────────────────────────
    const intact = contentCheck.valid && blockCheck.valid;

    return res.status(200).json({
      success: true,
      reportId:    row.id,
      intact,
      verdict:     intact ? "✅ Report is authentic and untampered" : "🚨 Integrity violation detected",
      timestamp:   row.created_at,
      updatedAt:   row.updated_at,
      contentHash: {
        stored:   row.content_hash,
        valid:    contentCheck.valid,
        reason:   contentCheck.reason,
      },
      blockchain: {
        blockIndex:   row.block_index ?? null,
        blockHash:    row.block_hash  ?? null,
        previousHash: row.previous_hash ?? null,
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
