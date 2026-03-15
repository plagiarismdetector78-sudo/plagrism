import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, ...settings } = req.body;

  try {
    // Check if settings exist for user
    const checkResult = await query(
      'SELECT id FROM user_security WHERE user_id = $1',
      [userId]
    );

    if (checkResult.rows.length === 0) {
      // Insert new settings
      await query(
        `INSERT INTO user_security (user_id, two_factor_enabled, login_alerts, device_management, suspicious_activity_detection)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, settings.two_factor_enabled, settings.login_alerts, settings.device_management, settings.suspicious_activity_detection]
      );
    } else {
      // Update existing settings
      await query(
        `UPDATE user_security 
         SET two_factor_enabled = $2, login_alerts = $3, device_management = $4, suspicious_activity_detection = $5
         WHERE user_id = $1`,
        [userId, settings.two_factor_enabled, settings.login_alerts, settings.device_management, settings.suspicious_activity_detection]
      );
    }

    res.status(200).json({ success: true, message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}