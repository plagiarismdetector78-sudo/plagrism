import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";

const FeedbackPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const feedbackRes = await fetch(`/api/get-ai-feedback?userId=${userId}`);
      const feedbackData = await feedbackRes.json();

      if (feedbackData.success) {
        // Filter out practice session feedback, only show interview feedback
        const interviewFeedback = feedbackData.feedback.filter(item => 
          item.feedback_type === 'interview' || item.interview_id
        );
        setFeedback(interviewFeedback);
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
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

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/30';
    if (score >= 80) return 'bg-yellow-500/20 border-yellow-500/30';
    if (score >= 70) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>AI Feedback - Skill Scanner</title>
        <meta name="description" content="Get AI-powered feedback on your interview performance" />
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
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">Feedback</span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                Get detailed AI-powered insights on your interview performance
              </p>
            </div>

            {/* Feedback List */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Interview Feedback</h2>
                <span className="text-gray-400 text-sm">
                  {feedback.length} feedback entries
                </span>
              </div>

              {feedback.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No feedback yet</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Complete interviews to receive AI-powered feedback on your performance.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg mb-2">
                            {item.feedback_type.replace(/_/g, ' ').toUpperCase()}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Score: {item.score}/100</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBgColor(item.score)} ${getScoreColor(item.score)}`}>
                          {item.score}%
                        </div>
                      </div>

                      {item.strengths && item.strengths.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-green-400 font-medium text-sm mb-2">Strengths</h4>
                          <div className="flex flex-wrap gap-2">
                            {item.strengths.slice(0, 3).map((strength, index) => (
                              <span key={index} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.areas_for_improvement && item.areas_for_improvement.length > 0 && (
                        <div>
                          <h4 className="text-yellow-400 font-medium text-sm mb-2">Areas for Improvement</h4>
                          <div className="flex flex-wrap gap-2">
                            {item.areas_for_improvement.slice(0, 3).map((area, index) => (
                              <span key={index} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Detail Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Feedback Details</h3>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {selectedFeedback.feedback_type.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(selectedFeedback.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-lg font-bold border ${getScoreBgColor(selectedFeedback.score)} ${getScoreColor(selectedFeedback.score)}`}>
                    {selectedFeedback.score}%
                  </div>
                </div>

                {selectedFeedback.detailed_feedback && (
                  <div>
                    <h5 className="text-white font-medium mb-3">Detailed Feedback</h5>
                    <p className="text-gray-300 leading-relaxed">{selectedFeedback.detailed_feedback}</p>
                  </div>
                )}

                {selectedFeedback.strengths && selectedFeedback.strengths.length > 0 && (
                  <div>
                    <h5 className="text-green-400 font-medium mb-3">Strengths</h5>
                    <div className="space-y-2">
                      {selectedFeedback.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-300">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFeedback.areas_for_improvement && selectedFeedback.areas_for_improvement.length > 0 && (
                  <div>
                    <h5 className="text-yellow-400 font-medium mb-3">Areas for Improvement</h5>
                    <div className="space-y-2">
                      {selectedFeedback.areas_for_improvement.map((area, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-gray-300">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFeedback.recommendations && selectedFeedback.recommendations.length > 0 && (
                  <div>
                    <h5 className="text-blue-400 font-medium mb-3">Recommendations</h5>
                    <div className="space-y-2">
                      {selectedFeedback.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-gray-300">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default withAuth(FeedbackPage);