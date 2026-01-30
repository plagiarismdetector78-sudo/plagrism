import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { candidateId } = req.query;

    if (!candidateId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Candidate ID is required' 
      });
    }

    // Get all interviews with interviewer feedback for this candidate
    const result = await query(
      `SELECT 
        id,
        interviewer_id,
        candidate_id,
        full_name,
        email,
        position,
        scheduled_at,
        interviewer_feedback,
        status,
        created_at
      FROM scheduled_interviews 
      WHERE candidate_id = $1 
        AND interviewer_feedback IS NOT NULL 
        AND interviewer_feedback != ''
      ORDER BY scheduled_at DESC`,
      [candidateId]
    );

    return res.status(200).json({
      success: true,
      feedback: result.rows
    });

  } catch (error) {
    console.error('Error fetching interviewer feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch interviewer feedback',
      error: error.message
    });
  }
}
