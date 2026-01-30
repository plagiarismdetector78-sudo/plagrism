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
  const [viewTranscript, setViewTranscript] = useState(false);
  const [viewAIAnalysis, setViewAIAnalysis] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    fetchInterviewHistory();
    
    // Auto-update interview status every minute
    const statusUpdateInterval = setInterval(() => {
      updateExpiredInterviews();
    }, 60000); // Check every minute
    
    return () => clearInterval(statusUpdateInterval);
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('role') || 'candidate';
      const response = await fetch(`/api/get-interview-history?userId=${userId}&role=${userRole}`);
      const data = await response.json();
      if (data.success) {
        setInterviews(data.interviews || []);
        // Auto-update status on fetch
        updateExpiredInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error('Error fetching interview history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateExpiredInterviews = async (interviewList = interviews) => {
    const now = new Date();
    const expiredInterviews = interviewList.filter(interview => {
      if (!interview.scheduled_at || interview.status === 'completed' || interview.status === 'cancelled' || interview.status === 'pending') return false;
      const scheduledDate = new Date(interview.scheduled_at);
      const duration = interview.duration || 60;
      const endTime = new Date(scheduledDate.getTime() + duration * 60000);
      return endTime < now; // Interview time has passed
    });
    
    // Update status to pending for expired interviews
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
      fetchInterviewHistory(); // Refresh the list
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
    
    // Normalize status for comparison
    const status = interview.status?.toLowerCase();
    
    if (filter === 'scheduled') {
      // Include both 'scheduled' status and upcoming interviews
      const scheduledDate = interview.scheduled_at ? new Date(interview.scheduled_at) : null;
      return status === 'scheduled' || (scheduledDate && scheduledDate > new Date() && status !== 'completed' && status !== 'cancelled');
    }
    
    return status === filter.toLowerCase();
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'in_progress': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };
  
  const handleMarkAsCompleted = async (interviewId) => {
    if (!confirm('Mark this interview as completed?')) return;
    
    try {
      const response = await fetch('/api/update-interview-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interviewId: interviewId,
          status: 'completed' 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchInterviewHistory(); // Refresh the list
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };
  
  const handleCancelInterview = async (interviewId) => {
    if (!confirm('Cancel this interview? This action cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/update-interview-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interviewId: interviewId,
          status: 'cancelled' 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchInterviewHistory(); // Refresh the list
      } else {
        alert('Failed to cancel interview');
      }
    } catch (error) {
      console.error('Error cancelling interview:', error);
      alert('Error cancelling interview');
    }
  };
  
  const fetchInterviewReport = async (interviewId) => {
    setLoadingReport(true);
    try {
      // Try fetching by interview ID first, then by room ID
      let response = await fetch(`/api/get-report-by-interview?interviewId=${interviewId}`);
      let data = await response.json();
      
      // If not found by interview ID, try by room ID
      if (!data.success && selectedInterview.meeting_room_id) {
        console.log('⚠️ Report not found by interview ID, trying room ID:', selectedInterview.meeting_room_id);
        response = await fetch(`/api/get-report-by-interview?roomId=${selectedInterview.meeting_room_id}`);
        data = await response.json();
      }
      
      if (data.success) {
        setReportData(data.report);
        return data.report;
      } else {
        console.warn('No report found for interview ID:', interviewId, 'or room ID:', selectedInterview.meeting_room_id);
        alert('No report found for this interview');
        return null;
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error loading report');
      return null;
    } finally {
      setLoadingReport(false);
    }
  };
  
  const handleViewTranscript = async () => {
    setLoadingReport(true);
    try {
      // Get transcript from interview_reports table
      const report = await fetchInterviewReport(selectedInterview.id);
      
      if (report && report.full_transcript) {
        setViewTranscript(true);
      } else {
        alert('No transcript available for this interview');
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      alert('Error loading transcript');
    } finally {
      setLoadingReport(false);
    }
  };
  
  const handleViewAIAnalysis = async () => {
    const report = await fetchInterviewReport(selectedInterview.id);
    if (report && report.evaluation_data) {
      setViewAIAnalysis(true);
    } else {
      alert('No AI analysis available for this interview');
    }
  };
  
  const handleGenerateReport = async () => {
    setGeneratingPDF(true);
    try {
      const report = await fetchInterviewReport(selectedInterview.id);
      if (!report) {
        setGeneratingPDF(false);
        return;
      }
      
      // Import PDF generator dynamically
      const { generateInterviewReportPDF } = await import('../../lib/pdf-generator');
      
      // Prepare report data with correct candidate ID
      const pdfData = {
        roomId: report.room_id || selectedInterview.meeting_room_id,
        questionCategory: report.question_category || 'General',
        duration: report.duration || 'N/A',
        questionsCount: report.evaluation_data?.questionsCount || report.questions_asked?.length || 0,
        questionsAsked: report.questions_asked || [],
        interviewerName: report.interviewer_name || 'N/A',
        interviewerEmail: report.interviewer_email || 'N/A',
        candidateName: report.candidate_name || selectedInterview.full_name || 'N/A',
        candidateEmail: report.candidate_email || selectedInterview.email || 'N/A',
        candidateId: report.candidate_id || selectedInterview.candidate_id,
        evaluation: report.evaluation_data || {},
        fullTranscript: report.full_transcript || 'No transcript available'
      };
      
      const pdfBlob = generateInterviewReportPDF(pdfData);
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Interview_Report_${pdfData.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };
  
  const handleOpenFeedbackModal = () => {
    setFeedbackText(selectedInterview.interviewer_feedback || '');
    setShowFeedbackModal(true);
  };
  
  const handleSaveFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Please enter feedback before saving');
      return;
    }
    
    setSavingFeedback(true);
    try {
      const response = await fetch('/api/save-interviewer-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: selectedInterview.id,
          feedback: feedbackText.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Feedback saved successfully!');
        setShowFeedbackModal(false);
        fetchInterviewHistory(); // Refresh to show feedback was added
      } else {
        alert('Failed to save feedback');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Error saving feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

            {/* Filter Tabs */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-1 mb-6 inline-flex">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('scheduled')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  filter === 'scheduled'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  filter === 'pending'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  filter === 'completed'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  filter === 'cancelled'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Cancelled
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total', value: interviews.length, color: 'blue' },
                { label: 'Scheduled', value: interviews.filter(i => i.status?.toLowerCase() === 'scheduled' || (!i.status && i.scheduled_at && new Date(i.scheduled_at) > new Date())).length, color: 'blue' },
                { label: 'Pending', value: interviews.filter(i => i.status?.toLowerCase() === 'pending').length, color: 'yellow' },
                { label: 'Completed', value: interviews.filter(i => i.status?.toLowerCase() === 'completed').length, color: 'green' },
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
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setSelectedInterview(interview)}
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                              >
                                View
                              </button>
                              
                              {/* Mark as Completed button - show for pending and scheduled */}
                              {(interview.status?.toLowerCase() === 'pending' || interview.status?.toLowerCase() === 'scheduled') && (
                                <button
                                  onClick={() => handleMarkAsCompleted(interview.id)}
                                  className="text-green-400 hover:text-green-300 text-sm font-medium"
                                >
                                  ✓ Complete
                                </button>
                              )}
                              
                              {/* Cancel button - show for scheduled and pending */}
                              {(interview.status?.toLowerCase() === 'scheduled' || interview.status?.toLowerCase() === 'pending') && (
                                <button
                                  onClick={() => handleCancelInterview(interview.id)}
                                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                                >
                                  ✕ Cancel
                                </button>
                              )}
                              
                              {interview.meeting_room_id && (
                                <button
                                  onClick={() => router.push(`/meeting/${interview.meeting_room_id}`)}
                                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                                >
                                  Join
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
                  <button 
                    onClick={handleViewTranscript}
                    disabled={loadingReport}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingReport ? 'Loading...' : 'View Transcript'}
                  </button>
                  <button 
                    onClick={handleViewAIAnalysis}
                    disabled={loadingReport}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingReport ? 'Loading...' : 'AI Analysis'}
                  </button>
                  <button 
                    onClick={handleGenerateReport}
                    disabled={generatingPDF || loadingReport}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingPDF ? 'Loading...' : 'View Report'}
                  </button>
                </div>
                
                {/* Give Feedback Button */}
                {(selectedInterview.status === 'completed' || selectedInterview.status === 'pending') && (
                  <div className="pt-3 border-t border-white/10 mt-3">
                    <button 
                      onClick={handleOpenFeedbackModal}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{selectedInterview.interviewer_feedback ? 'Edit Feedback' : 'Give Feedback'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transcript Modal */}
        {viewTranscript && (reportData || selectedInterview) && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Interview Transcript</h3>
                <button
                  onClick={() => {
                    setViewTranscript(false);
                    setReportData(null);
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Candidate: {reportData?.candidate_name || selectedInterview.full_name}
                  </h4>
                  <h4 className="text-sm font-medium text-gray-400 mb-4">
                    Room: {reportData?.room_id || selectedInterview.meeting_room_id}
                  </h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                      {reportData?.full_transcript || selectedInterview.transcript || 'No transcript available'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Modal */}
        {viewAIAnalysis && reportData && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">AI Analysis</h3>
                <button
                  onClick={() => {
                    setViewAIAnalysis(false);
                    setReportData(null);
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                  <h4 className="text-lg font-bold text-white mb-2">Overall Score</h4>
                  <div className="text-4xl font-bold text-white">
                    {reportData.evaluation_data?.overallScore || 0}%
                  </div>
                  <p className="text-gray-300 mt-2">
                    {reportData.evaluation_data?.overallScore >= 80 ? 'Excellent Performance' : 
                     reportData.evaluation_data?.overallScore >= 60 ? 'Good Performance' : 
                     'Needs Improvement'}
                  </p>
                </div>

                {/* Detailed Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Technical Accuracy</h5>
                    <div className="text-2xl font-bold text-white">
                      {reportData.evaluation_data?.technicalScore || 0}%
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Communication</h5>
                    <div className="text-2xl font-bold text-white">
                      {reportData.evaluation_data?.communicationScore || 0}%
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Problem Solving</h5>
                    <div className="text-2xl font-bold text-white">
                      {reportData.evaluation_data?.problemSolvingScore || 0}%
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Code Quality</h5>
                    <div className="text-2xl font-bold text-white">
                      {reportData.evaluation_data?.codeQualityScore || 0}%
                    </div>
                  </div>
                </div>

                {/* AI Detection */}
                {reportData.evaluation_data?.aiDetection && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <h5 className="text-sm font-medium text-yellow-400 mb-2">AI Usage Detection</h5>
                    <p className="text-white">
                      Probability: {reportData.evaluation_data.aiDetection.probability || 0}%
                    </p>
                    <p className="text-gray-300 text-sm mt-2">
                      {reportData.evaluation_data.aiDetection.explanation || 'No additional details'}
                    </p>
                  </div>
                )}

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <h5 className="text-sm font-medium text-green-400 mb-2">Strengths</h5>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                      {reportData.evaluation_data?.strengths?.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      )) || <li>No strengths recorded</li>}
                    </ul>
                  </div>
                  
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                    <h5 className="text-sm font-medium text-orange-400 mb-2">Areas for Improvement</h5>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                      {reportData.evaluation_data?.improvements?.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      )) || <li>No improvements noted</li>}
                    </ul>
                  </div>
                </div>

                {/* Feedback */}
                {reportData.evaluation_data?.feedback && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Overall Feedback</h5>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {reportData.evaluation_data.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interviewer Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Give Feedback to Candidate</h3>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Candidate: {selectedInterview?.full_name}
                  </h4>
                  <h4 className="text-sm font-medium text-gray-400 mb-4">
                    Position: {selectedInterview?.position}
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your thoughts about the candidate's performance, strengths, areas for improvement, and overall assessment..."
                    rows={8}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    This feedback will be visible to the candidate
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFeedback}
                    disabled={savingFeedback || !feedbackText.trim()}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingFeedback ? 'Saving...' : 'Save Feedback'}
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