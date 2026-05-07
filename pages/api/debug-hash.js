// TEMP debug — delete after fixing
import { query } from "../../lib/db";
import { buildContentFingerprint, computeContentHash, normalizeDate } from "../../lib/blockchain";

export default async function handler(req, res) {
  const { reportId } = req.query;

  const result = await query(
    `SELECT ir.id, ir.interview_id, ir.interviewer_id, ir.candidate_id,
            ir.interviewer_name, ir.candidate_name, ir.interviewer_email, ir.candidate_email,
            ir.question_category, ir.room_id, ir.duration, ir.report_type, ir.created_at,
            bl.content_hash AS bl_content_hash, bl.block_hash AS bl_block_hash,
            bl.created_at AS bl_created_at
     FROM interview_reports ir
     LEFT JOIN blockchain_ledger bl ON bl.id = ir.block_id
     WHERE ir.id = $1`,
    [reportId]
  );

  if (!result.rows.length) return res.status(404).json({ error: "not found" });

  const row = result.rows[0];
  const fingerprint = buildContentFingerprint(row);
  const recomputed  = computeContentHash(row);

  return res.status(200).json({
    stored_content_hash:     row.bl_content_hash,
    recomputed_content_hash: recomputed,
    match:                   recomputed === row.bl_content_hash,
    fingerprint_used:        fingerprint,
    created_at_raw:          row.created_at,
    created_at_type:         typeof row.created_at,
    created_at_is_date:      row.created_at instanceof Date,
    created_at_normalized:   normalizeDate(row.created_at),
    bl_created_at_raw:       row.bl_created_at,
    bl_created_at_normalized: normalizeDate(row.bl_created_at),
  });
}
