// pages/api/get-interview-report.js
import { query } from '../../lib/db';
import { ensureReportSchemaReady } from '../../lib/ensureReportSchema';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        await ensureReportSchemaReady();

        const { reportId } = req.query;
        if (!reportId) {
            return res.status(400).json({ success: false, message: 'Report ID is required' });
        }

        const result = await query(
            `SELECT ir.*,
                    bl.block_index,
                    bl.block_hash,
                    bl.previous_hash,
                    bl.created_at AS block_created_at
             FROM interview_reports ir
             LEFT JOIN blockchain_ledger bl ON bl.id = ir.block_id
             WHERE ir.id = $1`,
            [reportId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const report = result.rows[0];

        try {
            report.questions_asked = typeof report.questions_asked === 'string'
                ? JSON.parse(report.questions_asked || '[]')
                : report.questions_asked || [];
        } catch (e) { report.questions_asked = []; }

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
            report.evaluation_data = {};
        }

        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('❌ Error fetching interview report:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch interview report', error: error.message });
    }
}
