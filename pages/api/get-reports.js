import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const result = await query(
      'SELECT * FROM interview_reports WHERE interviewer_id = $1 OR candidate_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    // Parse JSON fields for each report
    const reports = result.rows.map(report => {
      try {
        // Use report_data (JSONB) if available
        if (report.report_data && typeof report.report_data === 'object') {
          report.evaluation_data = report.report_data;
        } else if (report.evaluation_data && typeof report.evaluation_data === 'string') {
          report.evaluation_data = JSON.parse(report.evaluation_data);
        }
        
        // Parse questions_asked if it's a string
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
