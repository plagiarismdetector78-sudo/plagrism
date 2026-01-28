import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function AboutUs() {
  const features = [
    {
      icon: '🎥',
      title: 'Live Video Interviews',
      description: 'High-quality real-time video interviews with integrated plagiarism detection and recording capabilities.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Detection',
      description: 'Advanced AI algorithms detect plagiarism, suspicious behavior, and ensure interview integrity in real-time.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: '⛓️',
      title: 'Blockchain Security',
      description: 'Immutable blockchain storage ensures interview results are transparent, secure, and tamper-proof.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '👐',
      title: 'Sign Language Support',
      description: 'Computer vision-powered sign language interpretation for inclusive and accessible hiring processes.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Comprehensive reports and analytics for interview performance, candidate evaluation, and hiring insights.',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      icon: '🔒',
      title: 'Secure Verification',
      description: 'Multi-factor authentication, identity verification, and secure session management for all interviews.',
      gradient: 'from-teal-500 to-green-500'
    }
  ];

  const team = [
    {
      name: 'Alex Johnson',
      role: 'CEO & Founder',
      bio: 'Former HR Tech executive with 10+ years in talent acquisition and AI applications.',
      avatar: '👨‍💼'
    },
    {
      name: 'Sarah Chen',
      role: 'CTO',
      bio: 'AI/ML specialist with expertise in computer vision and real-time systems architecture.',
      avatar: '👩‍💻'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Head of Product',
      bio: 'Product leader focused on creating intuitive user experiences for complex technical solutions.',
      avatar: '👨‍🎨'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'AI Research Lead',
      bio: 'PhD in Computer Science with publications in NLP and behavioral analysis.',
      avatar: '👩‍🔬'
    }
  ];

  // const stats = [
  //   { number: '10K+', label: 'Interviews Conducted' },
  //   { number: '98%', label: 'Accuracy Rate' },
  //   { number: '50+', label: 'Countries Served' },
  //   { number: '24/7', label: 'Platform Uptime' }
  // ];

  return (
    <>
      <Head>
        <title>About Us - Skill Scanner | AI-Powered Interview Platform</title>
        <meta name="description" content="Learn about Skill Scanner's mission to revolutionize hiring with AI-powered plagiarism detection, blockchain security, and real-time interview analysis." />
        <meta name="keywords" content="about skill scanner, AI interviews, hiring platform, interview technology" />
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
                Revolutionizing
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
                  Hiring with AI
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Skill Scanner is an AI-powered platform designed to ensure integrity, fairness, and transparency 
                in modern hiring processes through advanced plagiarism detection and blockchain security.
              </p>
            </div>
          </section>

          {/* Stats Section */}
          {/* <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                    <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section> */}

          {/* Mission Section */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Mission</h2>
                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    To create a world where hiring decisions are based on genuine skills and capabilities, 
                    free from deception and bias. We believe in leveraging technology to build trust and 
                    transparency in the recruitment process.
                  </p>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    By combining AI, blockchain, and computer vision, we're setting new standards for 
                    interview integrity while making the hiring process more efficient and accessible for everyone.
                  </p>
                </div>
                <div className="relative">
                  <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">Accuracy</h3>
                          <p className="text-gray-400">Precise detection and analysis</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">⚡</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">Speed</h3>
                          <p className="text-gray-400">Real-time processing and results</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">🛡️</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">Security</h3>
                          <p className="text-gray-400">Enterprise-grade protection</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  How It Works
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Our platform combines cutting-edge technologies to deliver a comprehensive interview solution
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group relative backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105"
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
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`}></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Meet Our Team
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Passionate experts driving innovation in hiring technology
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {team.map((member, index) => (
                  <div
                    key={index}
                    className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 text-center hover:border-white/20 transition-all duration-300"
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                      {member.avatar}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                    <div className="text-purple-400 font-semibold mb-3">{member.role}</div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-12">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your Hiring?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of companies using Skill Scanner to make better, more informed hiring decisions.
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
                    Contact Sales
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
    </>
  );
}