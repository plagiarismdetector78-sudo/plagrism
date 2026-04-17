// pages/api/get-scheduled-interviews.js
import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const interviewerId = req.query.interviewerId;

    if (!interviewerId) {
      return res.status(400).json({
        success: false,
        error: "Missing interviewerId",
      });
    }

    const result = await query(
      `
      SELECT 
        si.id,
        si.candidate_id,
        si.interviewer_id,
        si.full_name,
        si.email,
        si.phone,
        si.scheduled_at,
        COALESCE(si.status, 'Scheduled') AS status,
        si.meeting_room_id
      FROM scheduled_interviews si
      WHERE si.interviewer_id = $1
      ORDER BY si.scheduled_at ASC
      `,
      [interviewerId]
    );

    const interviews = result.rows.map((row) => ({
      id: row.id,
      candidateId: row.candidate_id,
      interviewerId: row.interviewer_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      scheduledAt: row.scheduled_at ? row.scheduled_at.toISOString() : null,
      status: row.status,
      meetingRoomId: row.meeting_room_id,
    }));

    return res.status(200).json({ success: true, interviews });

  } catch (error) {
    console.error("Error loading scheduled interviews:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
