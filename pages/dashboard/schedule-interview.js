import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import withAuth from "../../lib/withAuth";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const ScheduleInterviewPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [scheduleData, setScheduleData] = useState({
    scheduledAt: "",
    duration: 60,
    interviewType: "technical",
    position: "Software Engineer",
    meetingRoomId: "",
    createRoom: true,
  });

  const [saving, setSaving] = useState(false);

  // ⭐ FIX #1 — fetchCandidates MUST be defined outside useEffect
  const fetchCandidates = async () => {
    try {
      const interviewerId = localStorage.getItem("userId");

      const response = await fetch(
        `/api/get-candidates?interviewerId=${interviewerId}`
      );
      const data = await response.json();

      if (data.success) {
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setSidebarCollapsed(true);

    fetchCandidates();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // ⭐ FIX #2 — ensure correct candidate ID mapping (db uses id OR user_id)
  const resolveCandidateId = (candidate) => {
   return candidate.id;
  };

  const scheduleInterview = async () => {
    if (!selectedCandidate || !scheduleData.scheduledAt) {
      alert("Please select a candidate and schedule date/time");
      return;
    }

    // Validate that scheduled time is not in the past
    const scheduledDate = new Date(scheduleData.scheduledAt);
    const now = new Date();
    if (scheduledDate < now) {
      alert("Cannot schedule an interview in the past. Please select a future date and time.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/schedule-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        // ⭐ FIX #3 — send correct interviewer & candidate ID
        body: JSON.stringify({
          candidateId: resolveCandidateId(selectedCandidate),
          interviewerId: localStorage.getItem("userId"),
          scheduledAt: scheduleData.scheduledAt, // Keep as-is, let backend handle timezone
          duration: scheduleData.duration,
          interviewType: scheduleData.interviewType,
          position: scheduleData.position,
          meetingRoomId: scheduleData.meetingRoomId || undefined,
          createRoom: scheduleData.createRoom,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Interview scheduled successfully!");
        if (data.meetingRoomId) {
          alert(`Meeting Room ID: ${data.meetingRoomId}`);
        }

        // Reset form
        setSelectedCandidate(null);
        setScheduleData({
          scheduledAt: "",
          duration: 60,
          interviewType: "technical",
          position: "Software Engineer",
          meetingRoomId: "",
          createRoom: true,
        });

        fetchCandidates(); // Refresh list
      } else {
        alert("Failed to schedule interview: " + data.error);
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      alert("Error scheduling interview");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Schedule Interview - Skill Scanner</title>
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
            {/* header */}
            <h1 className="text-3xl font-bold text-white mb-6">
              Schedule Interview
            </h1>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
                  
                  {/* Select Candidate */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Select Candidate
                    </label>
                    <select
                      value={selectedCandidate?.id || ""}
                      onChange={(e) => {
                        const candidate = candidates.find(c => String(c.id) === e.target.value);
                        setSelectedCandidate(candidate || null);
                      }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Select Candidate --</option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id} className="bg-gray-900">
                          {c.full_name} ({c.email})
                        </option>
                      ))}
                    </select>
                    {candidates.length === 0 && (
                      <p className="text-gray-400 text-sm mt-2">
                        No candidates available. Make sure candidates have completed their profiles.
                      </p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Schedule Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleData.scheduledAt}
                      min={(() => {
                        const now = new Date();
                        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                        return now.toISOString().slice(0, 16);
                      })()}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, scheduledAt: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Cannot schedule interviews in the past
                    </p>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={scheduleData.position}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, position: e.target.value })
                      }
                      placeholder="e.g., Software Engineer"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={scheduleData.duration}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, duration: parseInt(e.target.value) })
                      }
                      min="15"
                      max="180"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Interview Type */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Interview Type
                    </label>
                    <select
                      value={scheduleData.interviewType}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, interviewType: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="technical" className="bg-gray-900">Technical</option>
                      <option value="behavioral" className="bg-gray-900">Behavioral</option>
                      <option value="hr" className="bg-gray-900">HR</option>
                      <option value="mixed" className="bg-gray-900">Mixed</option>
                    </select>
                  </div>

                  {/* Meeting Room Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="createRoom"
                        checked={scheduleData.createRoom}
                        onChange={(e) =>
                          setScheduleData({ 
                            ...scheduleData, 
                            createRoom: e.target.checked,
                            meetingRoomId: e.target.checked ? "" : scheduleData.meetingRoomId
                          })
                        }
                        className="w-5 h-5 rounded border-white/20 bg-white/10 focus:ring-2 focus:ring-purple-500"
                      />
                      <label htmlFor="createRoom" className="text-white">
                        Auto-generate meeting room ID
                      </label>
                    </div>

                    {!scheduleData.createRoom && (
                      <input
                        type="text"
                        value={scheduleData.meetingRoomId}
                        onChange={(e) =>
                          setScheduleData({ ...scheduleData, meetingRoomId: e.target.value })
                        }
                        placeholder="Enter meeting room ID"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                      />
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={scheduleInterview}
                    disabled={saving || !selectedCandidate || !scheduleData.scheduledAt}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Scheduling..." : "Schedule Interview"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default withAuth(ScheduleInterviewPage, "interviewer");
