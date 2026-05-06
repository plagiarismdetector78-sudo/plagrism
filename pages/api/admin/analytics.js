import { query } from "../../../lib/db";
import { ensureAuthSchema } from "../../../lib/ensureAuthSchema";
import { assertAdmin } from "../../../lib/assertAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    await ensureAuthSchema();
    const userId = req.query.userId;
    await assertAdmin(userId);

    const [
      usersCount,
      candidatesCount,
      interviewersCount,
      pendingInterviewersCount,
      scheduledCount,
      reportsCount,
    ] = await Promise.all([
      query("SELECT COUNT(*)::int AS n FROM users", []),
      query("SELECT COUNT(*)::int AS n FROM users WHERE role='candidate'", []),
      query("SELECT COUNT(*)::int AS n FROM users WHERE role='interviewer' AND is_approved=true", []),
      query("SELECT COUNT(*)::int AS n FROM users WHERE role='interviewer' AND is_approved=false", []),
      query("SELECT COUNT(*)::int AS n FROM scheduled_interviews", []).catch(() => ({ rows: [{ n: 0 }] })),
      query("SELECT COUNT(*)::int AS n FROM interview_reports", []).catch(() => ({ rows: [{ n: 0 }] })),
    ]);

    return res.status(200).json({
      success: true,
      metrics: {
        users: usersCount.rows[0].n,
        candidates: candidatesCount.rows[0].n,
        interviewers: interviewersCount.rows[0].n,
        pendingInterviewers: pendingInterviewersCount.rows[0].n,
        scheduledInterviews: scheduledCount.rows[0].n,
        reports: reportsCount.rows[0].n,
      },
    });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return res.status(status).json({ success: false, message: msg });
  }
}

