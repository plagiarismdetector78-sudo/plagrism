import { useEffect, useState } from "react";
import Head from "next/head";
import withAuth from "../../lib/withAuth";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function AdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initLoading, setInitLoading] = useState(false);
  const [initMsg, setInitMsg] = useState(null);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?userId=${userId}`);
        const data = await res.json();
        if (data.success) setMetrics(data.metrics);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebarCollapsed", String(next));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const initReportSchema = async () => {
    if (!window.confirm(
      "⚠️ This will DROP and recreate the interview_reports and blockchain_ledger tables.\n\nALL existing report data will be permanently deleted.\n\nContinue?"
    )) return;
    const userId = localStorage.getItem("userId");
    setInitLoading(true);
    setInitMsg(null);
    try {
      const res = await fetch("/api/admin/init-report-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setInitMsg({ ok: data.success, text: data.message });
    } catch {
      setInitMsg({ ok: false, text: "Network error" });
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin - Skill Scanner</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            handleLogout={handleLogout}
          />

          <div
            className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? "ml-20" : "ml-0 md:ml-72"
            } p-4 md:p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Panel</span>
                </h1>
                <p className="text-gray-300 text-sm">System analytics and approvals</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-300">Loading analytics…</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: "Users", value: metrics?.users ?? 0 },
                  { label: "Candidates", value: metrics?.candidates ?? 0 },
                  { label: "Interviewers", value: metrics?.interviewers ?? 0 },
                  { label: "Pending interviewers", value: metrics?.pendingInterviewers ?? 0 },
                  { label: "Scheduled", value: metrics?.scheduledInterviews ?? 0 },
                  { label: "Reports", value: metrics?.reports ?? 0 },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4"
                  >
                    <div className="text-xs text-gray-400">{c.label}</div>
                    <div className="text-2xl font-bold text-white mt-1">{c.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-5">
                <div className="text-white font-semibold mb-2">Next steps</div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>- Review pending interviewer approvals</li>
                  <li>- Manage question pool and categories</li>
                  <li>- Monitor interview/report volume</li>
                </ul>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-5">
                <div className="text-white font-semibold mb-2">Security note</div>
                <div className="text-sm text-gray-300">
                  Interviewer accounts are blocked at login until approved. Admin emails are read from
                  <span className="font-mono"> ADMIN_EMAILS</span>.
                </div>
              </div>

              {/* Blockchain schema init */}
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-red-500/20 p-5 lg:col-span-2">
                <div className="text-white font-semibold mb-1 flex items-center gap-2">
                  <i className="fas fa-database text-red-400"></i>
                  Report Blockchain — Fresh Start
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Drops and recreates <span className="font-mono text-gray-300">interview_reports</span> and <span className="font-mono text-gray-300">blockchain_ledger</span> with SHA-256 integrity columns.
                  Run this <strong className="text-red-400">once</strong> to initialise the new schema. All existing report data will be cleared.
                </p>
                {initMsg && (
                  <div className={`text-sm mb-3 px-3 py-2 rounded-lg ${initMsg.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {initMsg.text}
                  </div>
                )}
                <button
                  onClick={initReportSchema}
                  disabled={initLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {initLoading ? "Initialising…" : "Initialise Blockchain Schema"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAuth(AdminDashboard, "admin");

