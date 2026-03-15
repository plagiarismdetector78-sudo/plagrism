// pages/api/get-profile.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const userRow = (await query('SELECT email FROM users WHERE id = $1', [userId])).rows[0];
    if (!userRow) return res.status(404).json({ success: false, error: 'User not found' });

    const profileRow = (await query(
      `SELECT full_name, phone, address, qualification, recent_studied, gender, bio FROM user_profiles WHERE user_id = $1`,
      [userId]
    )).rows[0];

    const profile = {
      email: userRow.email,
      fullName: profileRow ? profileRow.full_name : '',
      phone: profileRow ? profileRow.phone : '',
      address: profileRow ? profileRow.address : '',
      qualification: profileRow ? profileRow.qualification : '',
      recentStudied: profileRow ? profileRow.recent_studied : '',
      gender: profileRow ? profileRow.gender : '',
      bio: profileRow ? profileRow.bio : '' // Add bio field
    };

    return res.json({ success: true, profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}