// pages/api/generate-report.js
import { query } from "../../lib/db";
import { saveReportWithBlock } from "../../lib/saveReportWithBlock";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { userId, reportType, timeRange } = req.body;

  try {
    // ── Calculate date range ───────────────────────────────────────────────────
    let timeRangeStart = new Date();
    let timeRangeEnd   = new Date();

    switch (timeRange) {
      case "7d":  timeRangeStart.setDate(timeRangeStart.getDate() - 7);           break;
      case "30d": timeRangeStart.setDate(timeRangeStart.getDate() - 30);          break;
      case "90d": timeRangeStart.setDate(timeRangeStart.getDate() - 90);          break;
      case "1y":  timeRangeStart.setFullYear(timeRangeStart.getFullYear() - 1);   break;
      default:    timeRangeStart = null; timeRangeEnd = null;
    }

    // ── Gather stats ───────────────────────────────────────────────────────────
    const interviewsResult = await query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
              COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
       FROM scheduled_interviews
       WHERE user_id = $1
       ${timeRangeStart ? "AND scheduled_at BETWEEN $2 AND $3" : ""}`,
      timeRangeStart ? [userId, timeRangeStart, timeRangeEnd] : [userId]
    );

    const reportData = {
      ...interviewsResult.rows[0],
      average_score:     "85%",
      top_performer:     "N/A",
      improvement_areas: "Communication, Technical Skills",
    };

    // ── Save with blockchain ───────────────────────────────────────────────────
    const { reportId, blockIndex, contentHash, blockHash, createdAt } =
      await saveReportWithBlock({
        user_id:          userId,
        report_type:      reportType || "summary",
        report_data:      reportData,
        time_range_start: timeRangeStart,
        time_range_end:   timeRangeEnd,
      });

    // Return the full row for the caller
    const result = await query(
      `SELECT * FROM interview_reports WHERE id = $1`,
      [reportId]
    );

    return res.status(200).json({
      success: true,
      report: { ...result.rows[0], blockIndex, contentHash, blockHash, createdAt },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
