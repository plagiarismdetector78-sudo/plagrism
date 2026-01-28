"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaChevronDown,
  FaHome,
  FaInfoCircle,
  FaEnvelope,
  FaSignInAlt,
  FaVideo,
  FaChartLine,
  FaShieldAlt,
} from "react-icons/fa";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userId = localStorage.getItem("userId");
        const email = localStorage.getItem("email");
        const role = localStorage.getItem("role");
        const name = localStorage.getItem("name");

        if (userId && email) {
          setUser({ userId, email, role, name });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    
    // Check auth on route changes
    const handleRouteChange = () => checkAuth();
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [pathname]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("name");
      localStorage.removeItem("token");

      setUser(null);
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    router.push("/login");
    setIsMenuOpen(false);
  };

  const handleSignup = () => {
    router.push("/signup");
    setIsMenuOpen(false);
  };

  const isActive = (path) => pathname === path;

  const navItems = [
    { path: "/", label: "Home", icon: <FaHome className="text-sm" /> },
    {
      path: "/about-us",
      label: "About",
      icon: <FaInfoCircle className="text-sm" />,
    },
    {
      path: "/contact",
      label: "Contact",
      icon: <FaEnvelope className="text-sm" />,
    },
  ];

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getDashboardPath = () => {
    if (!user?.role) return "/dashboard";
    return user.role === "interviewer" 
      ? "/dashboard/interviewer" 
      : "/dashboard/candidate";
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMenuOpen(false);
      }
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isUserMenuOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-gray-900/95 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl' 
          : 'bg-gray-900/80 backdrop-blur-lg border-b border-purple-500/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 flex-shrink-0 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 group-hover:scale-105 transition-all duration-300">
                <FaShieldAlt className="text-white text-lg" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Skill Scanner
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 mx-8 flex-1 justify-center">
              {navItems.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  href={path}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
                    isActive(path)
                      ? "text-white bg-purple-500/20 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5 hover:border hover:border-white/10"
                  }`}
                >
                  <span
                    className={`transition-colors duration-300 ${
                      isActive(path) ? "text-purple-300" : "text-gray-400 group-hover:text-purple-300"
                    }`}
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                  {isActive(path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center space-x-3 relative user-menu-container">
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
                </div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group backdrop-blur-sm"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <FaUser className="text-white text-xs" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white capitalize">
                        {user.role || "user"}
                      </p>
                      <p className="text-xs text-gray-300 max-w-[120px] truncate">
                        {getUserDisplayName()}
                      </p>
                    </div>
                    <FaChevronDown
                      className={`text-gray-400 text-sm transition-transform duration-300 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-xl rounded-xl border border-purple-500/20 shadow-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-purple-500/10">
                        <p className="text-sm font-medium text-white">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-sm text-gray-300 truncate">
                          {user.email}
                        </p>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                            {user.role || "user"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={getDashboardPath()}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mx-2 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FaHome className="text-gray-400 text-sm" />
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          href="/dashboard/profile"
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mx-2 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FaUser className="text-gray-400 text-sm" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          href="/meeting/setup"
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mx-2 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FaVideo className="text-gray-400 text-sm" />
                          <span>Start Interview</span>
                        </Link>
                      </div>

                      <div className="border-t border-purple-500/10 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg mx-2 transition-colors"
                        >
                          <FaSignInAlt className="text-red-400 text-sm" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLogin}
                    className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignup}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/20"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center space-x-3 mobile-menu-container">
              {/* Mobile user avatar */}
              {!isLoading && user && (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm hover:shadow-md transition-shadow"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Open user menu"
                >
                  <FaUser className="text-white text-xs" />
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-300 border border-transparent hover:border-white/10"
                aria-expanded={isMenuOpen}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <FaTimes className="text-lg" />
                ) : (
                  <FaBars className="text-lg" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden absolute top-16 left-4 right-4 bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 py-3 z-50 mobile-menu-container">
              {/* Navigation Links */}
              <div className="space-y-1 px-3">
                {navItems.map(({ path, label, icon }) => (
                  <Link
                    key={path}
                    href={path}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
                      isActive(path)
                        ? "text-white bg-purple-500/20 border border-purple-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span
                      className={
                        isActive(path) ? "text-purple-300" : "text-gray-400"
                      }
                    >
                      {icon}
                    </span>
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {/* Auth Section - Mobile */}
              <div className="border-t border-purple-500/10 mt-3 pt-3 px-3">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-700 rounded-xl animate-pulse"></div>
                    <div className="h-10 bg-gray-700 rounded-xl animate-pulse"></div>
                  </div>
                ) : user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-white">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-300">{user.email}</p>
                      <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                        {user.role || "user"}
                      </span>
                    </div>

                    <Link
                      href={getDashboardPath()}
                      className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaHome className="text-gray-400 text-sm w-5" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUser className="text-gray-400 text-sm w-5" />
                      <span>My Profile</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-red-500/20"
                    >
                      <FaSignInAlt className="text-red-400 text-sm w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleLogin}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
                    >
                      <FaSignInAlt className="text-gray-400" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={handleSignup}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl py-3 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transform hover:scale-105 transition-all duration-300"
                    >
                      Get Started Free
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Backdrop for mobile menu */}
        {isMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Mobile User Dropdown */}
        {isUserMenuOpen && user && (
          <div className="lg:hidden fixed top-20 right-4 z-50 user-menu-container">
            <div className="w-64 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-purple-500/20 py-2">
              <div className="px-4 py-3 border-b border-purple-500/10">
                <p className="text-sm font-medium text-white">
                  {getUserDisplayName()}
                </p>
                <p className="text-sm text-gray-300 truncate">{user.email}</p>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                    {user.role || "user"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  href={getDashboardPath()}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mx-2 transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <FaHome className="text-gray-400 text-sm" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mx-2 transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <FaUser className="text-gray-400 text-sm" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/meeting/setup"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mx-2 transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <FaVideo className="text-gray-400 text-sm" />
                  <span>Start Interview</span>
                </Link>
              </div>

              <div className="border-t border-purple-500/10 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg mx-2 transition-colors"
                >
                  <FaSignInAlt className="text-red-400 text-sm" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backdrop for user dropdown */}
        {(isUserMenuOpen || isMenuOpen) && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setIsUserMenuOpen(false);
              setIsMenuOpen(false);
            }}
          />
        )}
      </nav>

      {/* Add padding to content below fixed navbar */}
      <div className="h-16" />
    </>
  );
}