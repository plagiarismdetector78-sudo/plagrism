// pages/api/update-interview-transcript.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { interviewId, roomId, transcript } = req.body;
        
        console.log('📝 === UPDATING TRANSCRIPT ===');
        console.log('Interview ID:', interviewId);
        console.log('Room ID:', roomId);
        console.log('Transcript length:', transcript?.length || 0);
        console.log('============================\n');

        if (!transcript) {
            return res.status(400).json({
                success: false,
                message: 'Transcript is required'
            });
        }

        let result;

        if (interviewId) {
            // Update by interview ID
            result = await query(
                `UPDATE scheduled_interviews 
                 SET transcript = $1, updated_at = NOW() 
                 WHERE id = $2 
                 RETURNING id`,
                [transcript, interviewId]
            );
        } else if (roomId) {
            // Update by room ID
            result = await query(
                `UPDATE scheduled_interviews 
                 SET transcript = $1, updated_at = NOW() 
                 WHERE meeting_room_id = $2 
                 RETURNING id`,
                [transcript, roomId]
            );
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either interviewId or roomId is required'
            });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transcript updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating transcript:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update transcript',
            error: error.message
        });
    }
}
