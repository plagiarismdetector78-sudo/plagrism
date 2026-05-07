import { useEffect, useState } from "react";
import Head from "next/head";
import withAuth from "../../lib/withAuth";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function AdminInterviewers() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); // tracks which interviewerUserId is being acted on
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const fetchPending = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pending-interviewers?userId=${userId}`);
      const data = await res.json();
      if (data.success) setPending(data.interviewers || []);
      else showToast(data.message || "Failed to load interviewers", "error");
    } catch {
      showToast("Network error loading interviewers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setSidebarCollapsed(true);
    fetchPending();
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

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const act = async (interviewerUserId, approve) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setActionLoading(interviewerUserId);
    try {
      const res = await fetch("/api/admin/approve-interviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, interviewerUserId, approve }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || (approve ? "Interviewer approved" : "Interviewer rejected"), "success");
        // Optimistically remove from list immediately
        setPending((prev) => prev.filter((u) => u.id !== interviewerUserId));
      } else {
        showToast(data.message || "Action failed", "error");
      }
    } catch {
      showToast("Network error, please try again", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Head>
        <title>Admin - Interviewer Approvals</title>
      </Head>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
          <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-0 md:ml-72"} p-4 md:p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Interviewer Approvals</h1>
                <p className="text-gray-300 text-sm">Approve pending interviewer signups.</p>
              </div>
              <button
                onClick={fetchPending}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20"
              >
                Refresh
              </button>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-4 md:p-6">
              {loading ? (
                <div className="text-gray-300 py-10 text-center">Loading pending interviewers…</div>
              ) : pending.length === 0 ? (
                <div className="text-gray-300 py-10 text-center">No pending interviewer accounts.</div>
              ) : (
                <div className="space-y-3">
                  {pending.map((u) => (
                    <div key={u.id} className="bg-black/30 rounded-xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">{u.full_name || "Interviewer"}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Requested: interviewer • Created: {u.created_at ? new Date(u.created_at).toLocaleString() : "N/A"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => act(u.id, true)}
                          disabled={actionLoading === u.id}
                          className="px-4 py-2 rounded-xl bg-green-600/80 hover:bg-green-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === u.id ? "Processing…" : "Approve"}
                        </button>
                        <button
                          onClick={() => act(u.id, false)}
                          disabled={actionLoading === u.id}
                          className="px-4 py-2 rounded-xl bg-red-600/70 hover:bg-red-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === u.id ? "Processing…" : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAuth(AdminInterviewers, "admin");

