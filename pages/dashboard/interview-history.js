import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";

const InterviewHistoryPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    fetchInterviewHistory();
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/get-interview-history?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error('Error fetching interview history:', error);
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

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true;
    return interview.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Head>
        <title>Interview History - Skill Scanner</title>
        <meta name="description" content="View past interviews and their details" />
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Interview History</h1>
                <p className="text-gray-300 text-sm md:text-base">
                  View and manage past interviews
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Interviews', value: interviews.length, color: 'blue' },
                { label: 'Completed', value: interviews.filter(i => i.status === 'completed').length, color: 'green' },
                { label: 'Scheduled', value: interviews.filter(i => i.status === 'scheduled').length, color: 'yellow' },
                { label: 'Cancelled', value: interviews.filter(i => i.status === 'cancelled').length, color: 'red' },
              ].map((stat, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      stat.color === 'blue' ? 'bg-blue-500/20' :
                      stat.color === 'green' ? 'bg-green-500/20' :
                      stat.color === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        stat.color === 'blue' ? 'text-blue-400' :
                        stat.color === 'green' ? 'text-green-400' :
                        stat.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 md:p-6 mb-6">
              <div className="flex flex-wrap gap-2">
                {['all', 'scheduled', 'completed', 'cancelled', 'in_progress'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-300 ${
                      filter === status
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Interviews Table */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No interviews found</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    {filter !== 'all' 
                      ? `No ${filter.replace('_', ' ')} interviews found.`
                      : "You haven't conducted any interviews yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Candidate</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date & Time</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Position</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Duration</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInterviews.map((interview) => (
                        <tr key={interview.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-white">
                              {interview.full_name || interview.email}
                            </div>
                            {interview.email && (
                              <div className="text-xs text-gray-400">{interview.email}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {formatDate(interview.scheduled_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {interview.position || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(interview.status)}`}>
                              {interview.status?.replace('_', ' ') || 'Scheduled'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {interview.duration || 'N/A'} min
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedInterview(interview)}
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                              >
                                View Details
                              </button>
                              {interview.meeting_room_id && (
                                <button
                                  onClick={() => router.push(`/meeting/${interview.meeting_room_id}`)}
                                  className="text-green-400 hover:text-green-300 text-sm font-medium"
                                >
                                  Join Again
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

        {/* Interview Detail Modal */}
        {selectedInterview && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Interview Details</h3>
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Candidate Name</h4>
                    <p className="text-white">{selectedInterview.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Email</h4>
                    <p className="text-white">{selectedInterview.email || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Phone</h4>
                    <p className="text-white">{selectedInterview.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Position</h4>
                    <p className="text-white">{selectedInterview.position || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Scheduled Date</h4>
                    <p className="text-white">{formatDate(selectedInterview.scheduled_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Status</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedInterview.status)}`}>
                      {selectedInterview.status?.replace('_', ' ') || 'Scheduled'}
                    </span>
                  </div>
                </div>

                {selectedInterview.meeting_room_id && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Meeting Room</h4>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-white/10 px-3 py-2 rounded-xl font-mono text-gray-300">
                        {selectedInterview.meeting_room_id}
                      </code>
                      <button
                        onClick={() => router.push(`/meeting/${selectedInterview.meeting_room_id}`)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                      >
                        Join Meeting
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4 border-t border-white/10">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors">
                    View Transcript
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors">
                    AI Analysis
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default withAuth(InterviewHistoryPage, 'interviewer');