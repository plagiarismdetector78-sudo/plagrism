// pages/api/update-profile.js
import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      userId,
      fullName,
      phone,
      address,
      qualification,
      recentStudied,
      gender,
      bio // Add bio field
    } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    // ✅ Check if profile exists
    const check = await query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    if (check.rows.length > 0) {
      // ✅ Update existing profile with bio
      await query(
        `UPDATE user_profiles
         SET full_name = $1, phone = $2, address = $3, qualification = $4, 
             recent_studied = $5, gender = $6, bio = $7, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $8`,
        [fullName, phone, address, qualification, recentStudied, gender, bio, userId]
      );
    } else {
      // ✅ Insert new profile with bio
      await query(
        `INSERT INTO user_profiles (user_id, full_name, phone, address, qualification, recent_studied, gender, bio)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, fullName, phone, address, qualification, recentStudied, gender, bio]
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}