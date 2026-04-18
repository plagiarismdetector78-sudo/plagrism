import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "Missing userId",
    });
  }

  try {
    /**
     * Fetch ALL scheduled interview details for the candidate
     * Including interviewer info, position, company, meeting room, etc.
     */
    const result = await query(
      `
      SELECT
        si.id,
        si.full_name,
        si.email,
        si.phone,
        si.scheduled_at,
        si.meeting_room_id,
        COALESCE(si.status, 'Scheduled') as status,
        si.position,
        si.interview_type,
        si.duration,
        si.interviewer_feedback,
        si.interviewer_id,
        u.email as interviewer_email,
        COALESCE(p.full_name, u.email, 'Interviewer') as interviewer
      FROM scheduled_interviews si
      LEFT JOIN users u ON u.id = si.interviewer_id
      LEFT JOIN user_profiles p ON p.user_id = si.interviewer_id
      WHERE si.candidate_id = $1
      ORDER BY si.scheduled_at ASC
      `,
      [userId]
    );

    const interviews = result.rows.map((row) => {
      let decision = null;
      let decisionNote = null;

      if (row.interviewer_feedback) {
        const normalized = String(row.interviewer_feedback).toLowerCase();
        if (normalized.includes('decision: pass') || normalized.includes('pass')) {
          decision = 'pass';
        } else if (normalized.includes('decision: fail') || normalized.includes('fail')) {
          decision = 'fail';
        }
        decisionNote = row.interviewer_feedback;
      }

      return {
        ...row,
        interviewer_decision: decision,
        interviewer_decision_note: decisionNote,
      };
    });

    return res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    console.error("❌ get-my-interviews-by-candidate-id ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
