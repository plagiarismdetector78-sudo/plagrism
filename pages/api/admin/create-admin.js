import bcrypt from "bcryptjs";
import { query } from "../../../lib/db";
import { ensureAuthSchema } from "../../../lib/ensureAuthSchema";
import { assertAdmin } from "../../../lib/assertAdmin";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await ensureAuthSchema();
    const { userId, email, password, name = "" } = req.body || {};
    await assertAdmin(userId);

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ success: false, message: "Invalid email" });

    const pass = String(password || "");
    if (pass.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

    const existing = await query("SELECT id, role FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1", [normalizedEmail]);
    if (existing.rows[0]) {
      await query("UPDATE users SET role='admin', is_approved=true, approved_at=NOW() WHERE id=$1", [existing.rows[0].id]);
      return res.status(200).json({ success: true, userId: existing.rows[0].id, promoted: true });
    }

    const hashed = await bcrypt.hash(pass, 10);
    const ins = await query(
      "INSERT INTO users (email, password_hash, role, is_approved, approved_at) VALUES ($1,$2,'admin',true,NOW()) RETURNING id",
      [normalizedEmail, hashed]
    );
    const newUserId = ins.rows[0].id;

    await query(
      `INSERT INTO user_profiles (user_id, full_name, phone, address, qualification, recent_studied, gender)
       VALUES ($1, $2, NULL, NULL, NULL, NULL, NULL)`,
      [newUserId, String(name || "").trim() || null]
    );

    return res.status(201).json({ success: true, userId: newUserId, promoted: false });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return res.status(status).json({ success: false, message: msg });
  }
}

