// pages/api/save-profile.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { userId, fullName, phone, address, qualification, recentStudied, gender } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, error: 'UserId is required' });

    const existsRes = await query('SELECT COUNT(*) FROM user_profiles WHERE user_id = $1', [userId]);
    const exists = parseInt(existsRes.rows[0].count, 10) > 0;

    if (exists) {
      await query(
        `UPDATE user_profiles SET full_name=$1, phone=$2, address=$3, qualification=$4, recent_studied=$5, gender=$6 WHERE user_id=$7`,
        [fullName || null, phone || null, address || null, qualification || null, recentStudied || null, gender || null, userId]
      );
      return res.json({ success: true, message: 'Profile updated successfully!' });
    } else {
      await query(
        `INSERT INTO user_profiles (user_id, full_name, phone, address, qualification, recent_studied, gender)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, fullName || null, phone || null, address || null, qualification || null, recentStudied || null, gender || null]
      );
      return res.json({ success: true, message: 'Profile created successfully!' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
