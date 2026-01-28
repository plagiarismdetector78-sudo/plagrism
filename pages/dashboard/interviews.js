import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";

const InterviewsPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/get-my-interviews-by-id?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '', full: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString(),
    };
  };

  const getStatusColor = (status, scheduledAt) => {
    if (!scheduledAt) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    if (scheduledDate > now) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (status === 'completed') return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (status === 'cancelled') return 'bg-red-500/20 text-red-300 border-red-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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

  const joinMeeting = (roomId) => {
    if (!roomId) {
      alert('No meeting room available');
      return;
    }
    router.push(`/meeting/${roomId}`);
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'upcoming' && new Date(interview.scheduledAt) > new Date()) ||
      (activeFilter === 'completed' && interview.status === 'completed') ||
      (activeFilter === 'past' && new Date(interview.scheduledAt) <= new Date() && interview.status !== 'cancelled');
    
    const matchesSearch = interview.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: interviews.length,
    upcoming: interviews.filter(i => i.scheduledAt && new Date(i.scheduledAt) > new Date()).length,
    completed: interviews.filter(i => i.status === 'completed').length,
    past: interviews.filter(i => i.scheduledAt && new Date(i.scheduledAt) <= new Date() && i.status !== 'cancelled').length,
  };

  return (
    <>
      <Head>
        <title>My Interviews - Skill Scanner</title>
        <meta name="description" content="View and manage your interview schedule" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            handleLogout={handleLogout}
          />

          <div className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-20' : 'ml-0 md:ml-72'
          } p-4 md:p-6`}>
            
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Interviews</h1>
              <p className="text-gray-300 text-sm md:text-base">
                Track your upcoming and completed interviews
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total', value: stats.total, color: 'blue' },
                { label: 'Upcoming', value: stats.upcoming, color: 'green' },
                { label: 'Completed', value: stats.completed, color: 'purple' },
                { label: 'Past', value: stats.past, color: 'orange' },
              ].map((stat, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center`}>
                      <svg className={`w-5 h-5 text-${stat.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters and Search */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'upcoming', 'completed', 'past'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-300 ${
                        activeFilter === filter
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-2 min-w-80">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search interviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Interviews List */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-gray-400">Loading interviews...</span>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No interviews found</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    {searchTerm || activeFilter !== 'all' 
                      ? 'No interviews match your current filters. Try adjusting your search or filters.'
                      : "You don't have any interviews scheduled yet. Check back later for updates."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-white">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Position</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Company</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date & Time</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
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
                                <div className="text-sm font-medium text-white">{interview.position || 'Not specified'}</div>
                                {interview.interviewer && (
                                  <div className="text-xs text-gray-400">With {interview.interviewer}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {interview.company || 'N/A'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-white">{formattedDate.date}</div>
                                <div className="text-xs text-gray-400">{formattedDate.time}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex space-x-2">
                                  {interview.meetingRoomId && (
                                    <button
                                      onClick={() => joinMeeting(interview.meetingRoomId)}
                                      className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 transform hover:scale-105"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      <span>Join</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => router.push(`/dashboard/ai-feedback?interview=${interview.id}`)}
                                    className="flex items-center space-x-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 border border-blue-500/30"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Feedback</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
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
                                {interview.position || 'Interview'}
                              </h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>{interview.company || 'N/A'}</span>
                              </div>
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

                          {interview.interviewer && (
                            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Interviewer: {interview.interviewer}</span>
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            {interview.meetingRoomId && (
                              <button
                                onClick={() => joinMeeting(interview.meetingRoomId)}
                                className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 transform hover:scale-105"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Join</span>
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/dashboard/ai-feedback?interview=${interview.id}`)}
                              className="flex items-center space-x-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 border border-blue-500/30"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Feedback</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default withAuth(InterviewsPage, 'candidate');