// pages/api/save-interviewer-feedback.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { interviewId, feedback } = req.body;

        if (!interviewId || !feedback) {
            return res.status(400).json({
                success: false,
                message: 'Interview ID and feedback are required'
            });
        }

        // Update scheduled_interviews with interviewer feedback
        const result = await query(
            `UPDATE scheduled_interviews 
             SET interviewer_feedback = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING id, interviewer_feedback`,
            [feedback, interviewId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        console.log('✅ Interviewer feedback saved for interview:', interviewId);

        res.status(200).json({
            success: true,
            message: 'Feedback saved successfully',
            interview: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error saving interviewer feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save feedback',
            error: error.message
        });
    }
}
