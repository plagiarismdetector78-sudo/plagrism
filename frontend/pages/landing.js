// pages/landing.js
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Safely check for user data
    try {
      const userId = localStorage.getItem("userId");
      const role = localStorage.getItem("role");
      if (userId && role) {
        setUser({ role });
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  const features = [
    {
      icon: "🎥",
      title: "Live Video Interviews",
      description: "High-quality real-time video interviews with integrated plagiarism detection and recording.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "🤖",
      title: "AI-Powered Detection",
      description: "Advanced AI algorithms detect plagiarism and suspicious behavior in real-time during interviews.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: "⛓️",
      title: "Blockchain Security",
      description: "Immutable blockchain storage ensures interview results are transparent and tamper-proof.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "👐",
      title: "Sign Language Support",
      description: "Computer vision-powered sign language interpretation for inclusive hiring processes.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: "📊",
      title: "Smart Analytics",
      description: "Comprehensive reports and analytics for interview performance and candidate evaluation.",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: "🔒",
      title: "Secure Verification",
      description: "Multi-factor authentication and identity verification for secure interview sessions.",
      gradient: "from-teal-500 to-green-500"
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime Reliability" },
    { number: "50ms", label: "Low Latency" },
    { number: "256-bit", label: "Encryption" },
    { number: "24/7", label: "Support" }
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
        <title>Skill Scanner - AI-Powered Interview Platform</title>
        <meta name="description" content="Revolutionize your hiring process with AI-powered plagiarism detection, blockchain security, and real-time video interviews." />
        <meta name="keywords" content="AI interviews, plagiarism detection, blockchain hiring, video interviews, recruitment platform" />
        <meta property="og:title" content="Skill Scanner - AI-Powered Interview Platform" />
        <meta property="og:description" content="Revolutionize your hiring process with AI-powered plagiarism detection and blockchain security." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black relative overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
            <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1500"></div>
          </div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        <div className="relative z-10">
          <Navbar />

          {/* Hero Section */}
          <section className="min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left Content */}
                <div className="text-center lg:text-left space-y-8">
                  <div className="space-y-6">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                      Revolutionize
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-gradient">
                        Hiring with AI
                      </span>
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-2xl">
                      Ensure interview integrity with AI-powered plagiarism detection, 
                      blockchain security, and real-time video analysis.
                    </p>
                  </div>

                  {/* Stats
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-white">{stat.number}</div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div> */}

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    {user ? (
                      <Link
                        href={
                          user.role === "interviewer"
                            ? "/dashboard/interviewer"
                            : "/dashboard/candidate"
                        }
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <span className="relative z-10">Go to Dashboard</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/signup"
                          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <span className="relative z-10">Start Free Trial</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        <Link
                          href="/login"
                          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                        >
                          <span className="relative z-10">Sign In</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Illustration */}
                <div className="relative flex justify-center lg:justify-end">
                  <div className="relative w-full max-w-lg">
                    <div className="relative z-10">
                      <Image
                        src="/assets/Interview.svg"
                        alt="AI Interview Platform Illustration"
                        width={600}
                        height={500}
                        className="w-full h-auto drop-shadow-2xl"
                        priority
                      />
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/20 rounded-full animate-float"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-400/20 rounded-full animate-float delay-1000"></div>
                    <div className="absolute top-1/2 -left-10 w-20 h-20 bg-blue-400/20 rounded-full animate-float delay-500"></div>
                    
                    {/* Glow Effects */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 lg:py-28 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Powerful Features
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Everything you need for modern, secure, and efficient hiring processes
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105"
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    {/* Hover Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`}></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 relative">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 backdrop-blur-lg border border-white/10">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your Hiring?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of companies using Skill Scanner to make better hiring decisions with AI and blockchain technology.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    Schedule Demo
                  </Link>
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

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </>
  );
}