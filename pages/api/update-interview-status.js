// pages/api/update-interview-status.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const { userId, status } = req.body || {};
    if (!userId || !status) return res.status(400).json({ success: false, error: 'Missing fields' });

    await query('UPDATE scheduled_interviews SET status=$1 WHERE user_id=$2', [status, userId]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
