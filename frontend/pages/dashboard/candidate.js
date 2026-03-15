import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";
import ProfileCompletionPopup from '../../components/ProfileCompletionPopup';
import useSWR from 'swr';

// fetcher for SWR
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};


const CandidateDashboard = () => {
  const router = useRouter();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('Candidate');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingRoomId, setMeetingRoomId] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Profile completion state
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);
  const [missingFields, setMissingFields] = useState([]);

  // userId (safe for SSR)
  const [userId, setUserId] = useState(null);
  const userIdRef = useRef(null);

  // SWR: only fetch when we have userId
const { data, error, mutate } = useSWR(
  userId ? `/api/get-my-interviews-by-candidate-id?userId=${userId}` : null,



    fetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 }
  );

  const interviews = data?.interviews || [];
  const normalizedInterviews = interviews.map(i => ({
  ...i,
  scheduledAt: i.scheduled_at,
  meetingRoomId: i.meeting_room_id,
}));

  // Auto-update expired interviews when data loads
  useEffect(() => {
    if (interviews.length > 0) {
      updateExpiredInterviews();
    }
  }, [data]);


  // Filter interviews based on active tab
 const filteredInterviews = normalizedInterviews.filter(interview => {

    const now = new Date();
    const scheduledDate = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    switch (activeTab) {
      case 'upcoming':
        // Show only today's upcoming interviews
        return scheduledDate && 
               scheduledDate >= today && 
               scheduledDate < tomorrow && 
               scheduledDate > now &&
               interview.status !== 'cancelled' &&
               interview.status !== 'completed';
      case 'completed':
        return interview.status === 'completed';
      case 'cancelled':
        return interview.status === 'cancelled';
      case 'all':
      default:
        return true;
    }
  });

  // Check profile completion
  const checkProfileCompletion = async (uid) => {
    try {
      const res = await fetch(`/api/check-profile-complete?userId=${uid}`);
      const data = await res.json();
      
      if (data.success) {
        setProfileComplete(data.isComplete);
        setMissingFields(data.missingFields || []);
        
        // Show popup if profile is not complete
        if (!data.isComplete) {
          setTimeout(() => {
            setShowProfilePopup(true);
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Error checking profile completion:', err);
    }
  };

  // run on mount: set userId, sidebar state, profile, resize handlers
  useEffect(() => {
    // responsive check
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // sidebar collapsed saved state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);

    // get userId from localStorage (client-side)
    const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (uid) {
      setUserId(uid);
      userIdRef.current = uid;
      // fetch profile and check completion
      fetchProfile(uid);
      checkProfileCompletion(uid);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // fetch profile for fullname
const fetchProfile = async (uid) => {
  try {
    const res = await fetch(`/api/get-profile?userId=${uid}`);
    const json = await res.json();

    if (json.success && json.profile) {
      const p = json.profile;

      // ALWAYS SAFE — guarantees no undefined text appears
      const safeName =
        p.fullName?.trim() ||
        `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
        "Candidate";

      setFullName(safeName);
    } else {
      setFullName("Candidate");
    }
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    setFullName("Candidate");
  }
};


  const handleProfileComplete = () => {
    setProfileComplete(true);
    setShowProfilePopup(false);
    // Refresh profile data
    if (userId) {
      fetchProfile(userId);
    }
  };

  // join meeting navigation
  const joinMeeting = (roomId) => {
    if (!roomId) {
      alert('No meeting room ID available');
      return;
    }
    router.push(`/meeting/${roomId}`);
  };

  // toggle sidebar and persist
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  // logout handler
  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // format helpers
  const formatDate = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '', full: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      full: date.toLocaleString('en-US'),
    };
  };

  const getStatusColor = (status, scheduledAt) => {
    if (!scheduledAt) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    if (scheduledDate > now) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (status === 'completed') return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (status === 'cancelled') return 'bg-red-500/20 text-red-300 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  };

  const getStatusText = (status, scheduledAt) => {
    if (!scheduledAt) return 'Pending';
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    if (scheduledDate > now) return 'Scheduled';
    if (status === 'completed') return 'Completed';
    if (status === 'cancelled') return 'Cancelled';
    return 'Pending';
  };
  
  const updateExpiredInterviews = async () => {
    if (!interviews || interviews.length === 0) return;
    
    const now = new Date();
    const expiredInterviews = interviews.filter(interview => {
      if (!interview.scheduledAt || interview.status === 'completed' || interview.status === 'cancelled' || interview.status === 'pending') return false;
      const scheduledDate = new Date(interview.scheduledAt);
      const duration = interview.duration || 60;
      const endTime = new Date(scheduledDate.getTime() + duration * 60000);
      return endTime < now;
    });
    
    for (const interview of expiredInterviews) {
      try {
        await fetch('/api/update-interview-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            interviewId: interview.id,
            status: 'pending'
          })
        });
      } catch (error) {
        console.error('Error updating interview status:', error);
      }
    }
    
    if (expiredInterviews.length > 0) {
      mutate(); // Refresh the SWR data
    }
  };
  
  // Auto-update status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      updateExpiredInterviews();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [interviews]);

  const stats = {
  total: normalizedInterviews.length,
  upcoming: normalizedInterviews.filter(
    i => i.scheduledAt && new Date(i.scheduledAt) > new Date()
  ).length,
  completed: normalizedInterviews.filter(i => i.status === 'completed').length,
  cancelled: normalizedInterviews.filter(i => i.status === 'cancelled').length,
};


  // UI for loading / errors (SWR)
  const loadingInterviews = !data && !error;

  return (
    <>
      <Head>
        <title>Candidate Dashboard - Skill Scanner</title>
        <meta name="description" content="Manage your interviews and track your progress on Skill Scanner" />
      </Head>

      {/* Profile Completion Popup */}
      {showProfilePopup && (
        <ProfileCompletionPopup
          userId={userId}
          missingFields={missingFields}
          onClose={() => setShowProfilePopup(false)}
          onProfileComplete={handleProfileComplete}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        {/* Navbar */}
        <Navbar />

        <div className="flex">
          {/* Sidebar Component */}
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            handleLogout={handleLogout}
          />

          {/* Main Content */}
          <div
            className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-20' : 'ml-0 md:ml-72'
            } p-4 md:p-6`}
          >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">{fullName}</span>!
                </h1>
                <p className="text-gray-300 text-sm md:text-base">
                  Manage your interviews and track your progress
                </p>
              </div>

              {/* Search Bar */}
              {/* <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 min-w-80 border border-white/20 shadow-lg">
                <input
                  type="text"
                  placeholder="Search jobs, interviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
                />
                <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Interviews</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Upcoming</p>
                    <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Cancelled</p>
                    <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Interviews Section */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div className="flex items-center space-x-3 mb-4 md:mb-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">My Interviews</h2>
                    <p className="text-gray-400 text-sm hidden md:block">
                      Your upcoming and completed interviews
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
                  {['upcoming', 'completed', 'cancelled', 'all'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${
                        activeTab === tab
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {loadingInterviews ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading interviews...</p>
                </div>
              ) : error ? (
                <div className="py-12 text-center text-red-400">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Failed to load interviews.</p>
                  <button 
                    onClick={() => mutate()}
                    className="mt-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredInterviews.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-white">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date & Time</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Position</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Interviewer</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInterviews.map((interview) => {
                          const formattedDate = formatDate(interview.scheduledAt);
                          const statusText = getStatusText(interview.status, interview.scheduledAt);
                          const statusColor = getStatusColor(interview.status, interview.scheduledAt);

                          return (
                            <tr key={interview.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-white">{formattedDate.date}</div>
                                <div className="text-xs text-gray-400">{formattedDate.time}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-white">
                                {interview.position || 'Not Provided'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {interview.interviewer || 'Not Provided'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {interview.meetingRoomId ? (
                                  <button
                                    onClick={() => joinMeeting(interview.meetingRoomId)}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    Join Meeting
                                  </button>
                                ) : (
                                  <span className="text-gray-500 text-sm">Room not ready</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {filteredInterviews.map((interview) => {
                      const formattedDate = formatDate(interview.scheduledAt);
                      const statusText = getStatusText(interview.status, interview.scheduledAt);
                      const statusColor = getStatusColor(interview.status, interview.scheduledAt);

                      return (
                        <div key={interview.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:border-purple-500/30 transition-all duration-300">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-base mb-1">
                                {interview.position || 'Interview Position Not Provided'}
                              </h3>
                              {interview.interviewer && (
                                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>Interviewer: {interview.interviewer}</span>
                                </div>
                              )}
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColor} flex-shrink-0 ml-2`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-300">{formattedDate.date}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-300">{formattedDate.time}</span>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            {interview.meetingRoomId ? (
                              <button
                                onClick={() => joinMeeting(interview.meetingRoomId)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm"
                              >
                                Join Meeting
                              </button>
                            ) : (
                              <span className="text-gray-500 text-sm">Room not ready</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                // Empty State
                <div className="text-center py-8 md:py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    No {activeTab !== 'all' ? activeTab : ''} interviews found
                  </h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                    {activeTab === 'upcoming' 
                      ? "You don't have any upcoming interviews scheduled. Check back later for updates."
                      : "No interviews match your current filter."}
                  </p>
                  <button
                    onClick={() => setShowMeetingModal(true)}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Join Meeting</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Meeting Room Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowMeetingModal(true)}
            className="relative bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>

            <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-75"></div>

            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-sm rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
              Join Meeting Room
              <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        </div>

        {/* Meeting Room Modal */}
        {showMeetingModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/90 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Join Meeting Room</h3>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Meeting Room ID
                </label>
                <input
                  type="text"
                  value={meetingRoomId}
                  onChange={(e) => setMeetingRoomId(e.target.value)}
                  placeholder="Enter room ID (e.g., 1yixqfpsh6a)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-sm"
                  onKeyPress={(e) => e.key === 'Enter' && joinMeeting(meetingRoomId)}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Enter the meeting ID provided by your interviewer
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => { setShowMeetingModal(false); joinMeeting(meetingRoomId); }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Join Meeting</span>
                </button>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="px-4 py-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default withAuth(CandidateDashboard, 'candidate');