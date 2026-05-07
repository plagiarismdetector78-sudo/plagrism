import { query } from '../../lib/db';
import { ensureReportSchemaReady } from '../../lib/ensureReportSchema';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    await ensureReportSchemaReady();

    const result = await query(
      `SELECT ir.*,
              bl.block_index,
              bl.block_hash,
              bl.previous_hash,
              bl.created_at AS block_created_at
       FROM interview_reports ir
       LEFT JOIN blockchain_ledger bl ON bl.id = ir.block_id
       WHERE ir.interviewer_id = $1 OR ir.candidate_id = $1
       ORDER BY ir.created_at DESC LIMIT 50`,
      [userId]
    );

    const reports = result.rows.map(report => {
      try {
        if (report.report_data && typeof report.report_data === 'object') {
          report.evaluation_data = report.report_data;
        } else if (report.evaluation_data && typeof report.evaluation_data === 'string') {
          report.evaluation_data = JSON.parse(report.evaluation_data);
        }
        if (report.questions_asked && typeof report.questions_asked === 'string') {
          report.questions_asked = JSON.parse(report.questions_asked);
        }
      } catch (e) {
        console.error('Error parsing report data:', e);
      }
      return report;
    });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
