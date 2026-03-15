// pages/api/update-interview.js
import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { interviewId, scheduledAt, position, duration, interviewType } = req.body;

    if (!interviewId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        error: "Missing interviewId or scheduledAt",
      });
    }

    await query(
      `
      UPDATE scheduled_interviews
      SET scheduled_at = $1,
          position = $2,
          duration = $3,
          interview_type = $4
      WHERE id = $5
      `,
      [
        scheduledAt, 
        position || "Software Engineer",
        duration || 60,
        interviewType || "technical",
        interviewId
      ]
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update interview",
    });
  }
}
