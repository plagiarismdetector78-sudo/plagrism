import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";

const PlagiarismDetectionPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [newCheck, setNewCheck] = useState({
    content: '',
    contentType: 'interview_transcript'
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    fetchPlagiarismChecks();
  }, []);

  const fetchPlagiarismChecks = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/get-plagiarism-checks?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setChecks(data.checks || []);
      }
    } catch (error) {
      console.error('Error fetching plagiarism checks:', error);
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

  const runPlagiarismCheck = async () => {
    if (!newCheck.content.trim()) {
      alert('Please enter content to check');
      return;
    }

    setChecking(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/run-plagiarism-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          content: newCheck.content,
          contentType: newCheck.contentType
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Plagiarism check completed!');
        setNewCheck({ content: '', contentType: 'interview_transcript' });
        fetchPlagiarismChecks();
      } else {
        alert('Failed to run plagiarism check: ' + data.error);
      }
    } catch (error) {
      console.error('Error running plagiarism check:', error);
      alert('Error running plagiarism check');
    } finally {
      setChecking(false);
    }
  };

  const getSimilarityColor = (score) => {
    if (score < 20) return 'text-green-400';
    if (score < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSimilarityBgColor = (score) => {
    if (score < 20) return 'bg-green-500/20 border-green-500/30';
    if (score < 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <>
      <Head>
        <title>Plagiarism Detection - Skill Scanner</title>
        <meta name="description" content="AI-powered plagiarism detection for interview content" />
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
                  Plagiarism <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">Detection</span>
                </h1>
                <p className="text-gray-300 text-sm md:text-base">
                  AI-powered detection for interview content authenticity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* New Check Form */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Check Content</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                    <select
                      value={newCheck.contentType}
                      onChange={(e) => setNewCheck({...newCheck, contentType: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                    >
                      <option value="interview_transcript">Interview Transcript</option>
                      <option value="practice_session">Practice Session</option>
                      <option value="code_snippet">Code Snippet</option>
                      <option value="document">Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Content to Check</label>
                    <textarea
                      value={newCheck.content}
                      onChange={(e) => setNewCheck({...newCheck, content: e.target.value})}
                      placeholder="Paste the content you want to check for plagiarism..."
                      rows="8"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm resize-none"
                    />
                  </div>

                  <button
                    onClick={runPlagiarismCheck}
                    disabled={checking || !newCheck.content.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                  >
                    {checking ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Checking for Plagiarism...</span>
                      </div>
                    ) : (
                      'Check for Plagiarism'
                    )}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Detection Stats</h2>
                
                <div className="space-y-4">
                  {[
                    { label: 'Total Checks', value: checks.length, color: 'blue' },
                    { label: 'High Similarity', value: checks.filter(c => c.similarity_score >= 50).length, color: 'red' },
                    { label: 'Medium Similarity', value: checks.filter(c => c.similarity_score >= 20 && c.similarity_score < 50).length, color: 'yellow' },
                    { label: 'Low Similarity', value: checks.filter(c => c.similarity_score < 20).length, color: 'green' },
                  ].map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-gray-300">{stat.label}</span>
                      <span className="text-white font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h3 className="text-white font-semibold mb-2">How it works</h3>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Compares content against extensive database</li>
                    <li>• Uses AI to detect paraphrased content</li>
                    <li>• Identifies potential sources</li>
                    <li>• Provides similarity percentage</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Previous Checks */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Previous Checks</h2>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-gray-400">Loading checks...</span>
                </div>
              ) : checks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No plagiarism checks yet</h3>
                  <p className="text-gray-400 text-sm">
                    Run a plagiarism check to see results here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {checks.map((check) => (
                    <div
                      key={check.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedCheck(check)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg mb-2">
                            {check.content_type?.replace(/_/g, ' ').toUpperCase()}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {check.content_text?.substring(0, 200)}...
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getSimilarityBgColor(check.similarity_score)} ${getSimilarityColor(check.similarity_score)}`}>
                          {check.similarity_score}% Similar
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{new Date(check.created_at).toLocaleDateString()}</span>
                        <span>{check.flagged_sections?.length || 0} flagged sections</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Check Detail Modal */}
        {selectedCheck && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-gray-800/95 rounded-3xl border border-white/10 shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Plagiarism Check Details</h3>
                <button
                  onClick={() => setSelectedCheck(null)}
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
                      {selectedCheck.content_type?.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(selectedCheck.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-lg font-bold border ${getSimilarityBgColor(selectedCheck.similarity_score)} ${getSimilarityColor(selectedCheck.similarity_score)}`}>
                    {selectedCheck.similarity_score}% Similar
                  </div>
                </div>

                <div>
                  <h5 className="text-white font-medium mb-3">Checked Content</h5>
                  <div className="bg-white/5 rounded-2xl p-4 max-h-60 overflow-y-auto">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedCheck.content_text}</p>
                  </div>
                </div>

                {selectedCheck.flagged_sections && selectedCheck.flagged_sections.length > 0 && (
                  <div>
                    <h5 className="text-red-400 font-medium mb-3">Flagged Sections</h5>
                    <div className="space-y-3">
                      {selectedCheck.flagged_sections.map((section, index) => (
                        <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                          <p className="text-red-300 text-sm mb-2">{section.text}</p>
                          <div className="text-xs text-gray-400">
                            Similarity: {section.similarity}% | Matches: {section.matches?.length || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCheck.sources && selectedCheck.sources.length > 0 && (
                  <div>
                    <h5 className="text-yellow-400 font-medium mb-3">Potential Sources</h5>
                    <div className="space-y-2">
                      {selectedCheck.sources.map((source, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <div>
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                              {source.url}
                            </a>
                            <div className="text-gray-400 text-xs">Similarity: {source.similarity}%</div>
                          </div>
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

export default withAuth(PlagiarismDetectionPage, 'interviewer');