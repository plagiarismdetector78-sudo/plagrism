import { query } from "../../../lib/db";
import { ensureAuthSchema } from "../../../lib/ensureAuthSchema";
import { assertAdmin } from "../../../lib/assertAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await ensureAuthSchema();
    const userId = req.query.userId;
    await assertAdmin(userId);

    const result = await query(
      `
      SELECT
        u.id,
        u.email,
        u.created_at,
        u.is_approved,
        COALESCE(p.full_name, '') AS full_name
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.role = 'interviewer' AND u.is_approved = false
      ORDER BY u.created_at ASC
      `,
      []
    );

    return res.status(200).json({ success: true, interviewers: result.rows });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return res.status(status).json({ success: false, message: msg });
  }
}

