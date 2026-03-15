import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the data to your backend
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setErrors({ general: 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Us',
      details: 'support@skillscanner.com',
      description: 'Send us an email anytime',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: '+1 (555) 123-4567',
      description: 'Mon-Fri from 9am to 6pm',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      details: 'Start Chat',
      description: '24/7 customer support',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📍',
      title: 'Visit Us',
      details: '123 Tech Park, San Francisco, CA',
      description: 'Come say hello at our office',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const faqs = [
    {
      question: 'How does the AI plagiarism detection work?',
      answer: 'Our AI analyzes speech patterns, content originality, and cross-references with known sources in real-time.'
    },
    {
      question: 'Is my interview data secure?',
      answer: 'Yes, all data is encrypted and stored on blockchain for maximum security and transparency.'
    },
    {
      question: 'Can I integrate with my existing HR systems?',
      answer: 'Absolutely! We offer API integrations with most popular HR and ATS platforms.'
    },
    {
      question: 'What kind of support do you offer?',
      answer: 'We provide 24/7 customer support, dedicated account managers, and comprehensive documentation.'
    }
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Contact Us - Skill Scanner | Get in Touch</title>
        <meta name="description" content="Get in touch with Skill Scanner. Contact our team for support, sales inquiries, or technical assistance." />
        <meta name="keywords" content="contact skill scanner, support, sales, technical help" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
          </div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        <div className="relative z-10">
          <Navbar />

          {/* Hero Section */}
          <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                Get in
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
                  Touch
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Have questions or need assistance? Our team is here to help you transform your hiring process 
                with AI-powered interview technology.
              </p>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {contactMethods.map((method, index) => (
                  <div
                    key={index}
                    className="group backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 text-center hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105"
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${method.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-2xl">{method.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{method.title}</h3>
                    <p className="text-lg text-gray-300 mb-2">{method.details}</p>
                    <p className="text-sm text-gray-400">{method.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Form & FAQ */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
                  <h2 className="text-3xl font-bold text-white mb-6">Send us a Message</h2>
                  
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">✅</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Message Sent!</h3>
                      <p className="text-gray-300 mb-6">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
                      >
                        Send Another Message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                            Full Name *
                          </label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 ${
                              errors.name ? 'border-red-400' : 'border-white/20'
                            }`}
                          />
                          {errors.name && (
                            <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address *
                          </label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 ${
                              errors.email ? 'border-red-400' : 'border-white/20'
                            }`}
                          />
                          {errors.email && (
                            <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                          Subject *
                        </label>
                        <input
                          id="subject"
                          name="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="What is this regarding?"
                          className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 ${
                            errors.subject ? 'border-red-400' : 'border-white/20'
                          }`}
                        />
                        {errors.subject && (
                          <p className="mt-2 text-sm text-red-400">{errors.subject}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                          Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows="6"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us how we can help you..."
                          className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 resize-none ${
                            errors.message ? 'border-red-400' : 'border-white/20'
                          }`}
                        />
                        {errors.message && (
                          <p className="mt-2 text-sm text-red-400">{errors.message}</p>
                        )}
                      </div>

                      {errors.general && (
                        <div className="bg-red-400/20 border border-red-400/50 rounded-xl p-4">
                          <p className="text-red-300 text-sm">{errors.general}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Message...
                          </>
                        ) : (
                          'Send Message'
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* FAQ Section */}
                <div>
                  <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                  <div className="space-y-6">
                    {faqs.map((faq, index) => (
                      <div
                        key={index}
                        className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300"
                      >
                        <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>

                  {/* Additional Info */}
                  <div className="mt-8 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Response Time</h3>
                    <p className="text-gray-300 mb-4">
                      We typically respond to all inquiries within 2-4 hours during business hours, 
                      and within 24 hours for messages received outside of business hours.
                    </p>
                    <div className="flex items-center text-gray-400">
                      <span className="mr-2">🕐</span>
                      <span>Business Hours: Mon-Fri, 9:00 AM - 6:00 PM PST</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-black/40 backdrop-blur-lg border-t border-white/10 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                
                <p className="text-gray-400 mb-4">
                  &copy; {new Date().getFullYear()} Skill Scanner. All rights reserved.
                </p>
                <div className="flex justify-center space-x-6 text-sm text-gray-400">
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}