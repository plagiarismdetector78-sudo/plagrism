// pages/api/update-interview-time.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const { userId, scheduledAt } = req.body || {};
    if (!userId || !scheduledAt) return res.status(400).json({ success: false, error: 'Missing fields' });

    await query(
      'UPDATE scheduled_interviews SET scheduled_at=$1, status=$2 WHERE user_id=$3',
      [scheduledAt, 'Scheduled', userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
