import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const result = await query(
      `SELECT af.*, ps.title as practice_title
       FROM ai_feedback af
       LEFT JOIN practice_sessions ps ON af.practice_session_id = ps.id
       WHERE af.user_id = $1
       ORDER BY af.created_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, feedback: result.rows });
  } catch (error) {
    console.error('Error fetching AI feedback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}