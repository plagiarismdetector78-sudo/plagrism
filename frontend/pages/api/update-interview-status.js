// pages/api/update-interview-status.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const { interviewId, userId, status } = req.body || {};
    if (!status) return res.status(400).json({ success: false, error: 'Missing status field' });

    // Use interviewId if provided, otherwise fall back to userId (legacy)
    if (interviewId) {
      await query('UPDATE scheduled_interviews SET status=$1 WHERE id=$2', [status, interviewId]);
    } else if (userId) {
      await query('UPDATE scheduled_interviews SET status=$1 WHERE candidate_id=$2 OR interviewer_id=$2', [status, userId]);
    } else {
      return res.status(400).json({ success: false, error: 'Missing interviewId or userId' });
    }
    
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
