// pages/api/login.js
import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email = '', password = '' } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const result = await query('SELECT id, password_hash, role FROM users WHERE email = $1', [email]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const storedHash = row.password_hash;
    const ok = await bcrypt.compare(password, storedHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    return res.json({ message: 'Login successful', userId: row.id, role: row.role, email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}