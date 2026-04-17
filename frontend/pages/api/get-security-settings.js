import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const result = await query(
      'SELECT * FROM user_security WHERE user_id = $1',
      [userId]
    );

    // If no settings exist, return default settings
    if (result.rows.length === 0) {
      const defaultSettings = {
        two_factor_enabled: false,
        login_alerts: true,
        device_management: true,
        suspicious_activity_detection: true
      };
      return res.status(200).json({ success: true, settings: defaultSettings });
    }

    res.status(200).json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}