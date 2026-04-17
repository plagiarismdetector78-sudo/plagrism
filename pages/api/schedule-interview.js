import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const {
      candidateId,
      interviewerId,
      scheduledAt,
      meetingRoomId,
      createRoom,
      duration,
      interviewType,
      position
    } = req.body;

    if (!candidateId || !interviewerId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // ✅ Fetch candidate details properly
    const cand = await query(
      `
      SELECT 
        u.email,
        COALESCE(p.full_name, '') AS full_name,
        COALESCE(p.phone, '') AS phone
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = $1 AND u.role = 'candidate'
      `,
      [candidateId]
    );

    if (!cand.rows.length) {
      return res.status(400).json({
        success: false,
        error: "Invalid candidateId",
      });
    }

    const { full_name, email, phone } = cand.rows[0];

    // Generate room ID if required
    let finalRoomId = meetingRoomId;
    if (createRoom || !meetingRoomId) {
      finalRoomId = Math.random().toString(36).substring(2, 12);
    }

    // Insert into scheduled_interviews
    const result = await query(
      `
      INSERT INTO scheduled_interviews
      (candidate_id, interviewer_id, full_name, email, phone, scheduled_at, meeting_room_id, status, duration, interview_type, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Scheduled', $8, $9, $10)
      RETURNING id, meeting_room_id
      `,
      [
        candidateId,
        interviewerId,
        full_name || "Unknown",
        email || "",
        phone || "",
        scheduledAt,
        finalRoomId,
        duration || 60,
        interviewType || "technical",
        position || "Not Provided"
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Interview scheduled successfully",
      interviewId: result.rows[0].id,
      meetingRoomId: result.rows[0].meeting_room_id,
    });

  } catch (err) {
    console.error("SCHEDULE ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error scheduling interview",
    });
  }
}
