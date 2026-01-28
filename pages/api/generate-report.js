import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, reportType, timeRange } = req.body;

  try {
    // Calculate date range
    let timeRangeStart = new Date();
    let timeRangeEnd = new Date();
    
    switch (timeRange) {
      case '7d':
        timeRangeStart.setDate(timeRangeStart.getDate() - 7);
        break;
      case '30d':
        timeRangeStart.setDate(timeRangeStart.getDate() - 30);
        break;
      case '90d':
        timeRangeStart.setDate(timeRangeStart.getDate() - 90);
        break;
      case '1y':
        timeRangeStart.setFullYear(timeRangeStart.getFullYear() - 1);
        break;
      default:
        timeRangeStart = null;
        timeRangeEnd = null;
    }

    // Generate report data based on type
    let reportData = {};
    
    // Get interview statistics
    const interviewsResult = await query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
              COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
       FROM scheduled_interviews 
       WHERE user_id = $1 
       ${timeRangeStart ? 'AND scheduled_at BETWEEN $2 AND $3' : ''}`,
      timeRangeStart ? [userId, timeRangeStart, timeRangeEnd] : [userId]
    );

    reportData = {
      ...interviewsResult.rows[0],
      average_score: '85%',
      top_performer: 'John Doe',
      improvement_areas: 'Communication, Technical Skills'
    };

    const result = await query(
      `INSERT INTO interview_reports 
       (user_id, report_type, report_data, time_range_start, time_range_end) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, reportType, reportData, timeRangeStart, timeRangeEnd]
    );

    res.status(200).json({ success: true, report: result.rows[0] });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}