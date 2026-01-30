// pages/api/get-interview-by-room.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { roomId } = req.query;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        // Get scheduled interview by meeting_room_id
        const result = await query(
            `SELECT si.*
             FROM scheduled_interviews si
             WHERE si.meeting_room_id = $1
             LIMIT 1`,
            [roomId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No scheduled interview found for this room'
            });
        }
        
        const interview = result.rows[0];
        
        // Candidate info is already in scheduled_interviews table
        interview.candidate_name = interview.full_name;
        interview.candidate_email = interview.email;
        
        console.log('📋 Interview details fetched:', {
            scheduled_id: interview.id,
            candidate_id: interview.candidate_id,
            candidate_name: interview.candidate_name,
            candidate_email: interview.candidate_email,
            room_id: interview.meeting_room_id
        });

        res.status(200).json({
            success: true,
            interview: interview
        });
    } catch (error) {
        console.error('❌ Error fetching interview by room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interview',
            error: error.message
        });
    }
}
