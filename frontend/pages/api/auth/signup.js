// pages/api/signup.js
import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email = '', password = '', confirmPassword = '', role = '' } = req.body || {};
    if (!email || !password || !confirmPassword || !role) return res.status(400).json({ error: 'All fields are required' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const insertUser = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
      [email, hashed, role]
    );
    const userId = insertUser.rows[0].id;

    // Insert empty profile row
    await query(
      `INSERT INTO user_profiles (user_id, full_name, phone, address, qualification, recent_studied, gender)
       VALUES ($1, NULL, NULL, NULL, NULL, NULL, NULL)`,
      [userId]
    );

    return res.status(201).json({ message: 'User registered successfully', userId, role, email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}