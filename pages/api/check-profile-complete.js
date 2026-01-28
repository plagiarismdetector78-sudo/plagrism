import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }

    const profile = await query(
      `SELECT full_name, phone, qualification, recent_studied, gender, bio 
       FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    if (profile.rows.length === 0) {
      return res.json({ success: true, isComplete: false, missingFields: ['all'] });
    }

    const userProfile = profile.rows[0];
    
    // Required fields for profile completion (bio is optional for basic completion)
    const requiredFields = ['full_name', 'phone', 'qualification', 'recent_studied', 'gender'];
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!userProfile[field] || userProfile[field].trim() === '') {
        missingFields.push(field);
      }
    });

    // Check if bio is empty (for AI matching quality)
    const hasBio = userProfile.bio && userProfile.bio.trim() !== '';

    return res.json({ 
      success: true, 
      isComplete: missingFields.length === 0,
      missingFields,
      hasBio: hasBio,
      message: hasBio ? 'Profile complete with bio' : 'Profile complete but bio recommended for better matching'
    });
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}