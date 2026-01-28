import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const result = await query(
      `SELECT * FROM scheduled_interviews 
       WHERE user_id = $1 
       ORDER BY scheduled_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, interviews: result.rows });
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}