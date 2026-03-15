import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const result = await query(
      'SELECT * FROM help_tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json({ success: true, tickets: result.rows });
  } catch (error) {
    console.error('Error fetching help tickets:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}