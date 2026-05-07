// pages/api/save-interviewer-feedback.js
import { query } from "../../lib/db";
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
      return res.status(400).json({ success: false, message: "Decision must be either pass or fail" });
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

    // ── Update the linked report's evaluation data ─────────────────────────────
    const reportLookup = await query(
      `SELECT id, report_data, evaluation_data
       FROM interview_reports
       WHERE interview_id = $1 OR room_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [interviewId, meetingRoomId || ""]
    );

    let updatedReportId = null;

    if (reportLookup.rows.length > 0) {
      const row = reportLookup.rows[0];

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

      await query(
        `UPDATE interview_reports
         SET report_data     = $1::jsonb,
             evaluation_data = $2,
             updated_at      = NOW()
         WHERE id = $3`,
        [JSON.stringify(mergedData), JSON.stringify(mergedData), row.id]
      );

      updatedReportId = row.id;
      console.log(`✅ Feedback saved for report #${row.id}`);
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
