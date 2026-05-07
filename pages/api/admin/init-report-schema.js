// pages/api/admin/init-report-schema.js
// ONE-TIME route: drops and recreates interview_reports + blockchain_ledger.
// Protected — only callable by an admin.
// Call this ONCE from the admin panel or via curl to do the fresh start.

import { dropAndRecreateReportSchema } from "../../../lib/ensureReportSchema";
import { assertAdmin } from "../../../lib/assertAdmin";
import { ensureAuthSchema } from "../../../lib/ensureAuthSchema";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await ensureAuthSchema();
    const { userId } = req.body || {};
    await assertAdmin(userId);

    await dropAndRecreateReportSchema();

    return res.status(200).json({
      success: true,
      message: "interview_reports and blockchain_ledger recreated fresh. All previous report data has been cleared.",
    });
  } catch (e) {
    const msg = e?.message || String(e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    console.error("[init-report-schema] error:", e);
    return res.status(status).json({ success: false, message: msg });
  }
}
