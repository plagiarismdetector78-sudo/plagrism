import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";
import { generateInterviewReportPDF } from '../../lib/pdf-generator';

const ReportsPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/get-reports?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (reportId) => {
    try {
      const response = await fetch(`/api/get-interview-report?reportId=${reportId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedReport(data.report);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Failed to load report');
    }
  };

  const downloadPDF = (report) => {
    try {
      console.log('📊 Report data before PDF generation:', {
        questionsCount: report.questions_count,
        questionsAsked: report.questions_asked,
        duration: report.duration,
        evaluationData: report.evaluation_data,
        hasAIDetection: !!report.evaluation_data?.aiDetection,
        questionsCountFromEval: report.evaluation_data?.questionsCount
      });
      
      const pdf = generateInterviewReportPDF({
        roomId: report.room_id,
        questionCategory: report.question_category,
        questionsAsked: report.questions_asked,
        questionsCount: report.evaluation_data?.questionsCount || report.questions_count || report.questions_asked?.length || 0,
        duration: report.duration,
        interviewerName: report.interviewer_name,
        interviewerEmail: report.interviewer_email,
        candidateName: report.candidate_name,
        candidateEmail: report.candidate_email,
        fullTranscript: report.full_transcript,
        transcribedAnswer: report.full_transcript,
        evaluation: report.evaluation_data
      });
      
      const filename = `Interview_Report_${report.room_id}_${new Date(report.created_at).toLocaleDateString().replace(/\//g, '-')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  return (
    <>
      <Head>
        <title>Reports - Skill Scanner</title>
        <meta name="description" content="Detailed analytics and reports" />
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
                  Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Reports</span>
                </h1>
                <p className="text-gray-300 text-sm md:text-base">
                  AI-powered interview evaluations and downloadable reports
                </p>
              </div>
            </div>

            {/* Reports List */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <i className="fas fa-file-alt text-purple-400"></i>
                  <span>Interview Reports</span>
                </h2>
                <span className="text-sm text-gray-400">{reports.length} reports</span>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-6xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 text-lg">No reports yet</p>
                  <p className="text-gray-500 text-sm mt-2">Complete an interview and generate a report to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => {
                    const evaluation = report.evaluation_data || {};
                    const score = evaluation.overallScore || 0;
                    
                    return (
                      <div
                        key={report.id}
                        className="bg-black/30 rounded-xl border border-white/10 p-5 hover:border-purple-500/50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Report Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                                {score}%
                              </div>
                              <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getScoreBg(score)}`}>
                                {score >= 80 ? '✓ Excellent' : score >= 60 ? '○ Good' : '! Needs Work'}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm">
                                <i className="fas fa-user text-gray-400"></i>
                                <span className="text-gray-300">Interviewer: <strong className="text-white">{report.interviewer_name}</strong></span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <i className="fas fa-user-graduate text-gray-400"></i>
                                <span className="text-gray-300">Candidate: <strong className="text-white">{report.candidate_name}</strong></span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <i className="fas fa-layer-group text-gray-400"></i>
                                <span className="text-gray-300">{report.question_category}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <i className="fas fa-calendar text-gray-400"></i>
                                <span className="text-gray-300">{formatDate(report.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => viewReport(report.id)}
                              className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all"
                            >
                              <i className="fas fa-eye"></i>
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadPDF(report)}
                              className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
                            >
                              <i className="fas fa-download"></i>
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Report Modal */}
            {showModal && selectedReport && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-4 border-b border-white/20 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Interview Report Details</h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <i className="fas fa-times text-xl"></i>
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6">
                    {/* Score Section */}
                    <div className={`rounded-xl p-6 text-center border ${getScoreBg(selectedReport.evaluation_data?.overallScore || 0)}`}>
                      <div className="text-5xl font-bold text-white mb-2">
                        {selectedReport.evaluation_data?.overallScore || 0}%
                      </div>
                      <div className="text-gray-300">{selectedReport.evaluation_data?.interpretation || 'No interpretation'}</div>
                    </div>

                    {/* Participants */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">Interviewer</div>
                        <div className="text-white font-semibold">{selectedReport.interviewer_name}</div>
                        <div className="text-gray-400 text-sm">{selectedReport.interviewer_email}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">Candidate</div>
                        <div className="text-white font-semibold">{selectedReport.candidate_name}</div>
                        <div className="text-gray-400 text-sm">{selectedReport.candidate_email}</div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-4">
                      {['accuracy', 'completeness', 'understanding', 'clarity'].map((metric) => (
                        <div key={metric} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {selectedReport.evaluation_data?.[metric] || 0}%
                          </div>
                          <div className="text-xs text-gray-400 capitalize mt-1">{metric}</div>
                        </div>
                      ))}
                    </div>

                    {/* Feedback */}
                    {selectedReport.evaluation_data?.feedback && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="text-sm font-semibold text-gray-400 mb-2">AI Feedback</div>
                        <div className="text-gray-300 text-sm">{selectedReport.evaluation_data.feedback}</div>
                      </div>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={() => downloadPDF(selectedReport)}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all"
                    >
                      <i className="fas fa-download"></i>
                      <span>Download Full PDF Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default withAuth(ReportsPage, 'interviewer');