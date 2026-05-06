import { query } from "../../../lib/db";
import { ensureAuthSchema } from "../../../lib/ensureAuthSchema";
import { assertAdmin } from "../../../lib/assertAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await ensureAuthSchema();
    const { userId, targetUserId, role } = req.body || {};
    await assertAdmin(userId);

    const normalizedRole = String(role || "").trim().toLowerCase();
    if (!["candidate", "interviewer", "admin"].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    if (!targetUserId) return res.status(400).json({ success: false, message: "targetUserId is required" });

    // Prevent locking yourself out accidentally
    if (String(targetUserId) === String(userId) && normalizedRole !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own admin role." });
    }

    // If setting interviewer role, keep them pending until approved (admin can approve from approvals page)
    if (normalizedRole === "interviewer") {
      await query("UPDATE users SET role='interviewer', is_approved=false, approved_at=NULL WHERE id=$1", [targetUserId]);
      return res.status(200).json({ success: true });
    }

    // candidate/admin roles are always approved
    await query("UPDATE users SET role=$1, is_approved=true, approved_at=NOW() WHERE id=$2", [normalizedRole, targetUserId]);
    return res.status(200).json({ success: true });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return res.status(status).json({ success: false, message: msg });
  }
}

