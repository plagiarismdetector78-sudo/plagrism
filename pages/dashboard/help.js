import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";

const HelpPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('new-ticket');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/get-help-tickets?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSuccessMsg('');
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/create-help-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Ticket submitted successfully! We will get back to you soon.');
        setFormData({
          subject: '',
          category: 'technical',
          priority: 'medium',
          description: ''
        });
        fetchTickets(); // Refresh tickets list
        setActiveTab('my-tickets');
      } else {
        setSuccessMsg('Failed to submit ticket. Please try again.');
      }
    } catch (error) {
      setSuccessMsg('Error submitting ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'resolved': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'closed': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
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
        <title>Help & Support - Skill Scanner</title>
        <meta name="description" content="Get help and support for Skill Scanner" />
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
                Help & <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">Support</span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                Get assistance with any issues or questions you have
              </p>
            </div>

            {/* Tabs */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 mb-6">
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('new-ticket')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'new-ticket'
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Ticket
                </button>
                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'my-tickets'
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  My Tickets
                </button>
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'faq'
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FAQ
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              {activeTab === 'new-ticket' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">Create Support Ticket</h2>
                  
                  {successMsg && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-2xl">
                      <div className="flex items-center space-x-2 text-green-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{successMsg}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitTicket} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Subject *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          placeholder="Brief description of your issue"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                        >
                          <option value="technical" className="text-gray-800">Technical Issue</option>
                          <option value="billing" className="text-gray-800">Billing & Payment</option>
                          <option value="account" className="text-gray-800">Account Issue</option>
                          <option value="feature" className="text-gray-800">Feature Request</option>
                          <option value="other" className="text-gray-800">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priority *
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                      >
                        <option value="low" className="text-gray-800">Low</option>
                        <option value="medium" className="text-gray-800">Medium</option>
                        <option value="high" className="text-gray-800">High</option>
                        <option value="urgent" className="text-gray-800">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        required
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Please provide detailed information about your issue..."
                        rows="6"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                      <p className="text-gray-400 text-sm">
                        We typically respond within 24 hours
                      </p>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {submitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          'Submit Ticket'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'my-tickets' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">My Support Tickets</h2>
                    <span className="text-gray-400 text-sm">
                      {tickets.length} tickets
                    </span>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No tickets yet</h3>
                      <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                        Create your first support ticket to get help with any issues.
                      </p>
                      <button
                        onClick={() => setActiveTab('new-ticket')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        Create Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-white text-lg">{ticket.subject}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span>Ticket: {ticket.ticket_number}</span>
                                <span>•</span>
                                <span>Category: {ticket.category}</span>
                                <span>•</span>
                                <span className={getPriorityColor(ticket.priority)}>
                                  Priority: {ticket.priority}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-300 mb-4 line-clamp-2">
                            {ticket.description}
                          </p>

                          {ticket.resolution_notes && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                              <h4 className="text-blue-400 font-medium mb-2">Resolution Notes</h4>
                              <p className="text-blue-300 text-sm">{ticket.resolution_notes}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                            <div className="text-sm text-gray-400">
                              Last updated: {new Date(ticket.updated_at).toLocaleString()}
                            </div>
                            <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                  
                  <div className="space-y-6">
                    {[
                      {
                        question: "How does the AI plagiarism detection work?",
                        answer: "Our AI analyzes speech patterns, content originality, and cross-references with known sources in real-time using advanced natural language processing algorithms."
                      },
                      {
                        question: "Is my interview data secure?",
                        answer: "Yes, all data is encrypted end-to-end and stored on secure servers. We comply with industry-standard security protocols to protect your privacy."
                      },
                      {
                        question: "Can I download my interview recordings?",
                        answer: "Yes, you can download your interview recordings and reports from your dashboard after the interview is completed."
                      },
                      {
                        question: "How accurate is the AI feedback?",
                        answer: "Our AI feedback system has an accuracy rate of over 92% based on extensive training with professional interview data. However, it's designed to complement human judgment, not replace it."
                      },
                      {
                        question: "What browsers are supported?",
                        answer: "Skill Scanner works best on Chrome, Firefox, Safari, and Edge. We recommend using the latest version for optimal performance."
                      }
                    ].map((faq, index) => (
                      <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                        <h3 className="font-semibold text-white text-lg mb-3">{faq.question}</h3>
                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Still need help?</h4>
                        <p className="text-gray-300 text-sm">
                          Can't find the answer you're looking for? Please create a support ticket and our team will assist you.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default withAuth(HelpPage);