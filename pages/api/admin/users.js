import { query } from "../../../lib/db";
import { ensureAuthSchema } from "../../../lib/ensureAuthSchema";
import { assertAdmin } from "../../../lib/assertAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await ensureAuthSchema();
    const { userId, q = "", role = "" } = req.query || {};
    await assertAdmin(userId);

    const params = [];
    let n = 1;
    let sql = `
      SELECT
        u.id,
        u.email,
        u.role,
        u.is_approved,
        u.created_at,
        COALESCE(p.full_name, '') AS full_name
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE 1=1
    `;
    if (role) {
      sql += ` AND u.role = $${n++}`;
      params.push(String(role));
    }
    if (q) {
      sql += ` AND (LOWER(u.email) LIKE $${n} OR LOWER(COALESCE(p.full_name,'')) LIKE $${n})`;
      params.push(`%${String(q).toLowerCase()}%`);
      n++;
    }
    sql += " ORDER BY u.created_at DESC LIMIT 200";

    const result = await query(sql, params);
    return res.status(200).json({ success: true, users: result.rows });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return res.status(status).json({ success: false, message: msg });
  }
}

