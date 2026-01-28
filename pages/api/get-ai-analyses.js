import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const result = await query(
      `SELECT ia.*, si.interview_type 
       FROM interview_analysis ia
       LEFT JOIN scheduled_interviews si ON ia.interview_id = si.id
       WHERE ia.user_id = $1 
       ORDER BY ia.created_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, analyses: result.rows });
  } catch (error) {
    console.error('Error fetching AI analyses:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}