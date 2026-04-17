// pages/api/get-report-by-interview.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { interviewId, roomId } = req.query;

        if (!interviewId && !roomId) {
            return res.status(400).json({
                success: false,
                message: 'Interview ID or Room ID is required'
            });
        }

        let result;
        
        // Try to query by scheduled interview ID first, then by room_id
        if (interviewId) {
            // First try: interview_id matches the scheduled interview ID
            result = await query(
                `SELECT * FROM interview_reports WHERE interview_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [interviewId]
            );
            
            // If not found, try matching room_id (since interview_id might be room_id)
            if (result.rows.length === 0) {
                result = await query(
                    `SELECT * FROM interview_reports WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1`,
                    [interviewId]
                );
            }
        } else if (roomId) {
            result = await query(
                `SELECT * FROM interview_reports WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [roomId]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No report found for this interview'
            });
        }

        const report = result.rows[0];

        // Parse JSON fields safely
        try {
            report.questions_asked = typeof report.questions_asked === 'string' 
                ? JSON.parse(report.questions_asked || '[]') 
                : report.questions_asked || [];
        } catch (e) {
            report.questions_asked = [];
        }

        // Use report_data (JSONB) if available, otherwise parse evaluation_data (TEXT)
        try {
            if (report.report_data && typeof report.report_data === 'object') {
                report.evaluation_data = report.report_data;
            } else if (report.evaluation_data) {
                report.evaluation_data = typeof report.evaluation_data === 'string'
                    ? JSON.parse(report.evaluation_data)
                    : report.evaluation_data;
            } else {
                report.evaluation_data = {};
            }
        } catch (e) {
            console.error('Error parsing evaluation data:', e);
            report.evaluation_data = {};
        }

        res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        console.error('❌ Error fetching interview report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interview report',
            error: error.message
        });
    }
}
