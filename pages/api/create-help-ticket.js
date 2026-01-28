import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, subject, category, priority, description } = req.body;

  try {
    const result = await query(
      `INSERT INTO help_tickets (user_id, subject, category, priority, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, subject, category, priority, description]
    );

    res.status(200).json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Error creating help ticket:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}