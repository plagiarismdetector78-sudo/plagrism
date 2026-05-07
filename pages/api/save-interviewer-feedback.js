// pages/api/save-interviewer-feedback.js
import { query, withTransaction } from "../../lib/db";
import { computeContentHash, computeBlockHash } from "../../lib/blockchain";
import { ensureReportSchemaReady } from "../../lib/ensureReportSchema";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await ensureReportSchemaReady();

    const { interviewId, feedback, interviewDecision } = req.body;

    if (!interviewId || (!feedback && !interviewDecision)) {
      return res.status(400).json({
        success: false,
        message: "Interview ID and either decision or comment are required",
      });
    }

    const normalizedDecision = interviewDecision
      ? String(interviewDecision).toLowerCase()
      : null;

    if (normalizedDecision && !["pass", "fail"].includes(normalizedDecision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either pass or fail",
      });
    }

    const formattedFeedback = normalizedDecision
      ? `Decision: ${normalizedDecision.toUpperCase()}\nNote: ${feedback || ""}`.trim()
      : feedback;

    // ── Update scheduled_interviews ────────────────────────────────────────────
    const interviewResult = await query(
      `UPDATE scheduled_interviews
       SET interviewer_feedback = COALESCE($1, interviewer_feedback), updated_at = NOW()
       WHERE id = $2
       RETURNING id, interviewer_feedback, meeting_room_id`,
      [formattedFeedback || null, interviewId]
    );

    if (interviewResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    const { meeting_room_id: meetingRoomId } = interviewResult.rows[0];

    // ── Find the linked report ─────────────────────────────────────────────────
    const reportLookup = await query(
      `SELECT ir.*, bl.id AS ledger_id, bl.block_index, bl.previous_hash
       FROM interview_reports ir
       LEFT JOIN blockchain_ledger bl ON bl.id = ir.block_id
       WHERE ir.interview_id = $1 OR ir.room_id = $2
       ORDER BY ir.created_at DESC
       LIMIT 1`,
      [interviewId, meetingRoomId || ""]
    );

    let updatedReportId = null;

    if (reportLookup.rows.length > 0) {
      const row = reportLookup.rows[0];

      // Build merged evaluation data
      let baseData = {};
      if (row.report_data && typeof row.report_data === "object") {
        baseData = row.report_data;
      } else if (row.evaluation_data) {
        try {
          baseData = typeof row.evaluation_data === "string"
            ? JSON.parse(row.evaluation_data)
            : row.evaluation_data;
        } catch { baseData = {}; }
      }

      const mergedData = {
        ...baseData,
        interviewerDecision:     normalizedDecision || baseData.interviewerDecision || null,
        interviewerDecisionNote: feedback || baseData.interviewerDecisionNote || "",
        interviewerDecisionAt:   new Date().toISOString(),
      };

      const updatedAt = new Date().toISOString();

      // Re-compute content hash with updated fields
      const newContentHash = computeContentHash({
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
        evaluation_data:   JSON.stringify(mergedData),
        room_id:           row.room_id,
        duration:          row.duration,
        report_type:       row.report_type,
        report_data:       JSON.stringify(mergedData),
        created_at:        row.created_at,   // original timestamp preserved
      });

      await withTransaction(async (client) => {
        // Update report row
        await client.query(
          `UPDATE interview_reports
           SET report_data    = $1::jsonb,
               evaluation_data = $2,
               content_hash   = $3,
               updated_at     = $4
           WHERE id = $5`,
          [
            JSON.stringify(mergedData),
            JSON.stringify(mergedData),
            newContentHash,
            updatedAt,
            row.id,
          ]
        );

        // Update the linked blockchain block with the new content hash
        if (row.ledger_id) {
          const newBlockHash = computeBlockHash({
            block_index:   row.block_index,
            report_id:     row.id,
            content_hash:  newContentHash,
            previous_hash: row.previous_hash,
            created_at:    row.created_at,
          });

          await client.query(
            `UPDATE blockchain_ledger
             SET content_hash = $1, block_hash = $2
             WHERE id = $3`,
            [newContentHash, newBlockHash, row.ledger_id]
          );
        }
      });

      updatedReportId = row.id;
      console.log(`✅ Feedback saved & report re-hashed | report #${row.id} | new hash: ${newContentHash.slice(0, 16)}…`);
    }

    return res.status(200).json({
      success: true,
      message: "Decision and feedback saved successfully",
      interview: interviewResult.rows[0],
      reportId: updatedReportId,
    });
  } catch (error) {
    console.error("❌ Error saving interviewer feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save feedback",
      error: error.message,
    });
  }
}
