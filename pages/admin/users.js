import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import withAuth from "../../lib/withAuth";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";

function AdminUsers() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [createAdminErr, setCreateAdminErr] = useState("");
  const [createAdminForm, setCreateAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const fetchUsers = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ userId, q: queryText, role: roleFilter }).toString();
      const res = await fetch(`/api/admin/users?${qs}`);
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setSidebarCollapsed(true);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const submitCreateAdmin = async () => {
    setCreateAdminErr("");
    const email = String(createAdminForm.email || "").trim();
    const password = String(createAdminForm.password || "");
    const confirmPassword = String(createAdminForm.confirmPassword || "");
    if (!email) return setCreateAdminErr("Email is required");
    if (password.length < 8) return setCreateAdminErr("Password must be at least 8 characters");
    if (password !== confirmPassword) return setCreateAdminErr("Passwords do not match");

    const userId = localStorage.getItem("userId");
    setCreateAdminLoading(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: createAdminForm.name,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateAdminErr(data?.message || "Failed to create admin");
        return;
      }
      setCreateAdminOpen(false);
      setCreateAdminForm({ name: "", email: "", password: "", confirmPassword: "" });
      fetchUsers();
    } catch (e) {
      setCreateAdminErr("Network error. Please try again.");
    } finally {
      setCreateAdminLoading(false);
    }
  };

  const setRole = async (targetUserId, role) => {
    const userId = localStorage.getItem("userId");
    await fetch("/api/admin/set-user-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetUserId, role }),
    });
    fetchUsers();
  };

  const rows = useMemo(() => users, [users]);

  return (
    <>
      <Head>
        <title>Admin - Users</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
          <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-0 md:ml-72"} p-4 md:p-6`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <p className="text-gray-300 text-sm">Search users and view roles/approval status.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateAdminOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Add Admin
                </button>
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Search by email or name…"
                  className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white"
                >
                  <option value="">All roles</option>
                  <option value="candidate">Candidate</option>
                  <option value="interviewer">Interviewer</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Search
                </button>
              </div>

              {loading ? (
                <div className="text-gray-300 py-10 text-center">Loading users…</div>
              ) : rows.length === 0 ? (
                <div className="text-gray-300 py-10 text-center">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-white/10 text-sm text-gray-300">
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Role</th>
                        <th className="px-3 py-2 text-left">Approved</th>
                        <th className="px-3 py-2 text-left">Created</th>
                        <th className="px-3 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 text-sm">
                          <td className="px-3 py-2">{u.full_name || "-"}</td>
                          <td className="px-3 py-2">{u.email}</td>
                          <td className="px-3 py-2">{u.role}</td>
                          <td className="px-3 py-2">{u.role === "interviewer" ? (u.is_approved ? "Yes" : "Pending") : "—"}</td>
                          <td className="px-3 py-2">{u.created_at ? new Date(u.created_at).toLocaleString() : "—"}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              {u.role !== "admin" ? (
                                <button
                                  onClick={() => setRole(u.id, "admin")}
                                  className="px-3 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs"
                                >
                                  Make admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => setRole(u.id, "candidate")}
                                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs"
                                >
                                  Remove admin
                                </button>
                              )}
                              {u.role !== "interviewer" && (
                                <button
                                  onClick={() => setRole(u.id, "interviewer")}
                                  className="px-3 py-1 rounded-lg bg-yellow-600/70 hover:bg-yellow-600 text-white text-xs"
                                >
                                  Make interviewer (pending)
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {createAdminOpen && (
        <Modal
          onClose={() => {
            setCreateAdminOpen(false);
            setCreateAdminErr("");
          }}
        >
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">Create Admin</div>
              <div className="text-sm text-gray-600">Create a new admin by email + password.</div>
            </div>

            <div className="space-y-2">
              <input
                value={createAdminForm.name}
                onChange={(e) => setCreateAdminForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name (optional)"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                value={createAdminForm.email}
                onChange={(e) => setCreateAdminForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                value={createAdminForm.password}
                onChange={(e) => setCreateAdminForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Password (min 8 chars)"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                value={createAdminForm.confirmPassword}
                onChange={(e) => setCreateAdminForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {createAdminErr && <div className="text-sm text-red-600">{createAdminErr}</div>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCreateAdminOpen(false)}
                className="px-4 py-2 rounded-lg border"
                disabled={createAdminLoading}
              >
                Cancel
              </button>
              <button
                onClick={submitCreateAdmin}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white"
                disabled={createAdminLoading}
              >
                {createAdminLoading ? "Saving…" : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default withAuth(AdminUsers, "admin");

