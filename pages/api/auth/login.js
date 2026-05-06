// pages/api/login.js
import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { ensureAuthSchema } from '../../../lib/ensureAuthSchema';

function getAdminEmailSet() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  return new Set(
    String(raw)
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureAuthSchema();
    const { email = '', password = '' } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const result = await query('SELECT id, email, password_hash, role, is_approved FROM users WHERE email = $1', [email]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const storedHash = row.password_hash;
    const ok = await bcrypt.compare(password, storedHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const admins = getAdminEmailSet();
    const normalizedEmail = String(row.email || '').toLowerCase();
    const effectiveRole = admins.has(normalizedEmail) ? 'admin' : row.role;

    if (row.role === 'interviewer' && row.is_approved === false && effectiveRole !== 'admin') {
      return res.status(403).json({
        error: 'PENDING_APPROVAL',
        message: 'Your interviewer account is pending admin approval.',
      });
    }

    return res.json({
      message: 'Login successful',
      userId: row.id,
      role: effectiveRole,
      email: row.email,
      isApproved: row.is_approved !== false,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}