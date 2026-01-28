import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";

const AIAnalysisPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/get-ai-analyses?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Error fetching AI analyses:', error);
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
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <>
      <Head>
        <title>AI Analysis - Skill Scanner</title>
        <meta name="description" content="AI-powered interview insights and analysis" />
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
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">Analysis</span>
                </h1>
                <p className="text-gray-300 text-sm md:text-base">
                  Deep insights and analytics from your interviews
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Analyses', value: analyses.length, color: 'blue' },
                { label: 'Avg Sentiment', value: analyses.reduce((acc, a) => acc + (a.sentiment_score || 0), 0) / analyses.length || 0, color: 'green', isScore: true },
                { label: 'Avg Communication', value: analyses.reduce((acc, a) => acc + (a.communication_score || 0), 0) / analyses.length || 0, color: 'purple', isScore: true },
                { label: 'Avg Technical', value: analyses.reduce((acc, a) => acc + (a.technical_score || 0), 0) / analyses.length || 0, color: 'orange', isScore: true },
              ].map((stat, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {stat.isScore ? stat.value.toFixed(1) + '%' : stat.value}
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      stat.color === 'blue' ? 'bg-blue-500/20' :
                      stat.color === 'green' ? 'bg-green-500/20' :
                      stat.color === 'purple' ? 'bg-purple-500/20' : 'bg-orange-500/20'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        stat.color === 'blue' ? 'text-blue-400' :
                        stat.color === 'green' ? 'text-green-400' :
                        stat.color === 'purple' ? 'text-purple-400' : 'text-orange-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Analyses Grid */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-gray-400">Loading analyses...</span>
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No AI analyses found</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Complete interviews to get AI-powered insights and analysis.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white text-lg mb-2">
                            {analysis.analysis_type?.replace(/_/g, ' ').toUpperCase()}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {analysis.interview_position || 'Interview Analysis'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBgColor(analysis.sentiment_score)} ${getScoreColor(analysis.sentiment_score)}`}>
                          {analysis.sentiment_score}%
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Communication</span>
                            <span className={getScoreColor(analysis.communication_score)}>
                              {analysis.communication_score}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getScoreBgColor(analysis.communication_score).replace('border', 'bg').split(' ')[0]}`}
                              style={{ width: `${analysis.communication_score}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Technical</span>
                            <span className={getScoreColor(analysis.technical_score)}>
                              {analysis.technical_score}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getScoreBgColor(analysis.technical_score).replace('border', 'bg').split(' ')[0]}`}
                              style={{ width: `${analysis.technical_score}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Confidence</span>
                            <span className={getScoreColor(analysis.confidence_score)}>
                              {analysis.confidence_score}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getScoreBgColor(analysis.confidence_score).replace('border', 'bg').split(' ')[0]}`}
                              style={{ width: `${analysis.confidence_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Detail Modal */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Analysis Details</h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
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
                      {selectedAnalysis.analysis_type?.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {selectedAnalysis.interview_position || 'Interview Analysis'}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-lg font-bold border ${getScoreBgColor(selectedAnalysis.sentiment_score)} ${getScoreColor(selectedAnalysis.sentiment_score)}`}>
                    {selectedAnalysis.sentiment_score}%
                  </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(selectedAnalysis.communication_score)}`}>
                      {selectedAnalysis.communication_score}%
                    </div>
                    <div className="text-gray-400 text-sm">Communication</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(selectedAnalysis.technical_score)}`}>
                      {selectedAnalysis.technical_score}%
                    </div>
                    <div className="text-gray-400 text-sm">Technical</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(selectedAnalysis.confidence_score)}`}>
                      {selectedAnalysis.confidence_score}%
                    </div>
                    <div className="text-gray-400 text-sm">Confidence</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(selectedAnalysis.sentiment_score)}`}>
                      {selectedAnalysis.sentiment_score}%
                    </div>
                    <div className="text-gray-400 text-sm">Sentiment</div>
                  </div>
                </div>

                {selectedAnalysis.key_insights && (
                  <div>
                    <h5 className="text-green-400 font-medium mb-3">Key Insights</h5>
                    <div className="space-y-2">
                      {selectedAnalysis.key_insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-300">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnalysis.improvement_suggestions && (
                  <div>
                    <h5 className="text-yellow-400 font-medium mb-3">Improvement Suggestions</h5>
                    <div className="space-y-2">
                      {selectedAnalysis.improvement_suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-gray-300">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnalysis.transcript_summary && (
                  <div>
                    <h5 className="text-blue-400 font-medium mb-3">Transcript Summary</h5>
                    <p className="text-gray-300 leading-relaxed">{selectedAnalysis.transcript_summary}</p>
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

export default withAuth(AIAnalysisPage, 'interviewer');