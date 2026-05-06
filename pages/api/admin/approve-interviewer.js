import { query } from "../../../lib/db";
import { ensureAuthSchema } from "../../../lib/ensureAuthSchema";
import { assertAdmin } from "../../../lib/assertAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await ensureAuthSchema();
    const { userId, interviewerUserId, approve } = req.body || {};
    await assertAdmin(userId);

    if (!interviewerUserId) return res.status(400).json({ success: false, message: "interviewerUserId is required" });
    const shouldApprove = approve !== false;

    if (shouldApprove) {
      await query(
        "UPDATE users SET is_approved=true, approved_at=NOW() WHERE id=$1 AND role='interviewer'",
        [interviewerUserId]
      );
      return res.status(200).json({ success: true });
    }

    // Reject: keep record but prevent interviewer access by demoting to candidate
    await query(
      "UPDATE users SET role='candidate', is_approved=true, approved_at=NOW() WHERE id=$1 AND role='interviewer'",
      [interviewerUserId]
    );
    return res.status(200).json({ success: true });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return res.status(status).json({ success: false, message: msg });
  }
}

