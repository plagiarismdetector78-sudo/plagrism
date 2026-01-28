"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  FaHome,
  FaUser,
  FaUserTie,
  FaCogs,
  FaSignOutAlt,
  FaQuestionCircle,
  FaChartLine,
  FaSearchPlus,
  FaUserCircle,
  FaVideo,
  FaCalendarAlt,
  FaHistory,
  FaShieldAlt,
  FaRobot,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState } from "react";

const Sidebar = ({ sidebarCollapsed, toggleSidebar, handleLogout }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Shadow effect on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load user/role
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");

    setRole(storedRole || "candidate");
    setUser({ name, email });
  }, []);

  if (!role) {
    return (
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-72"
        } bg-gray-900/95 border-r border-purple-500/20 fixed left-0 top-16 min-h-screen flex items-center justify-center`}
      >
        <div className="animate-spin h-8 w-8 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }

  const sidebarItems =
    role === "interviewer"
      ? [
          {
            id: 1,
            name: "Dashboard",
            path: "/dashboard/interviewer",
            icon: <FaHome className="text-lg" />,
            description: "Interview overview",
          },
          // {
          //   id: 2,
          //   name: "Schedule Interview",
          //   path: "/dashboard/schedule-interview",
          //   icon: <FaCalendarAlt className="text-lg" />,
          //   description: "Create new interviews",
          // },
          {
            id: 4,
            name: "Plagiarism Detection",
            path: "/dashboard/plagiarism-detection",
            icon: <FaSearchPlus className="text-lg" />,
            description: "AI-powered detection",
          },
          {
            id: 5,
            name: "Interview History",
            path: "/dashboard/interview-history",
            icon: <FaHistory className="text-lg" />,
            description: "Past interviews",
          },
          {
            id: 6,
            name: "Reports",
            path: "/dashboard/reports",
            icon: <FaChartLine className="text-lg" />,
            description: "Detailed analytics",
          },
          {
            id: 7,
            name: "Profile",
            path: "/dashboard/profile",
            icon: <FaUserCircle className="text-lg" />,
            description: "Account settings",
          },
        ]
      : [
          {
            id: 1,
            name: "Dashboard",
            path: "/dashboard/candidate",
            icon: <FaHome className="text-lg" />,
            description: "Your overview",
          },
          {
            id: 2,
            name: "My Interviews",
            path: "/dashboard/interviews",
            icon: <FaVideo className="text-lg" />,
            description: "Upcoming & past",
          },
          {
            id: 4,
            name: "AI Feedback",
            path: "/dashboard/feedback",
            icon: <FaRobot className="text-lg" />,
            description: "Performance insights",
          },
          {
            id: 5,
            name: "My Profile",
            path: "/dashboard/profile",
            icon: <FaUserTie className="text-lg" />,
            description: "Personal information",
          },
          {
            id: 6,
            name: "Security",
            path: "/dashboard/security",
            icon: <FaShieldAlt className="text-lg" />,
            description: "Account security",
          },
          {
            id: 7,
            name: "Help & Support",
            path: "/dashboard/help",
            icon: <FaQuestionCircle className="text-lg" />,
            description: "Get assistance",
          },
        ];

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* SIDEBAR WRAPPER (scrollable) */}
      <div
        className={`
          fixed left-0 top-16 z-[60]
          ${sidebarCollapsed ? "w-20" : "w-72"}
          h-[calc(100vh-4rem)] 
          overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30
          bg-gray-900/95 backdrop-blur-xl
          border-r border-purple-500/20
          transition-all duration-500
          ${scrolled ? "shadow-purple-500/10" : "shadow-xl"}
        `}
      >
        <div className="p-4 flex flex-col">

          {/* USER INFO */}
          {!sidebarCollapsed && user && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <FaUser className="text-white text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-300 truncate">
                    {user.email || ""}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                  {role}
                </span>
                <span className="text-xs text-gray-400">Active</span>
              </div>
            </div>
          )}

          {/* COLLAPSED USER ICON */}
          {sidebarCollapsed && user && (
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <FaUser className="text-white text-lg" />
              </div>
            </div>
          )}

          {/* COLLAPSE BUTTON */}
          <button
            onClick={toggleSidebar}
            className={`
              w-full flex items-center
              ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}
              py-3 mb-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl
              border border-transparent hover:border-white/10
              transition-all duration-300
            `}
          >
            {!sidebarCollapsed && (
              <span className="text-sm">Navigation</span>
            )}
            <div className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg">
              {sidebarCollapsed ? (
                <FaChevronRight className="text-gray-400" />
              ) : (
                <FaChevronLeft className="text-gray-400" />
              )}
            </div>
          </button>

          {/* NAV LINKS */}
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  title={sidebarCollapsed ? item.name : ""}
                  className={`
                    w-full flex items-center 
                    ${sidebarCollapsed ? "justify-center px-2" : "px-4"}
                    py-3 rounded-xl transition-all duration-300
                    ${
                      active
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md border border-purple-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    }
                  `}
                >
                  <span
                    className={`${
                      sidebarCollapsed ? "" : "mr-3 w-6 flex justify-center"
                    } ${active ? "text-white" : "text-gray-400"}`}
                  >
                    {item.icon}
                  </span>

                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm truncate">{item.name}</span>
                      <span className="text-xs text-gray-400 truncate">
                        {item.description}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* SETTINGS + LOGOUT */}
          <div className="pt-4 border-t border-purple-500/10 space-y-2">
            <button
              onClick={() => router.push("/dashboard/settings")}
              className={`
                w-full flex items-center
                ${sidebarCollapsed ? "justify-center px-2" : "px-4"}
                py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl
                border border-transparent hover:border-white/10
                transition
              `}
            >
              <FaCogs className={`${sidebarCollapsed ? "" : "mr-3"} text-gray-400`} />
              {!sidebarCollapsed && <span className="text-sm">Settings</span>}
            </button>

            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center
                ${sidebarCollapsed ? "justify-center px-2" : "px-4"}
                py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl
                border border-red-500/20 hover:border-red-500/30
                transition
              `}
            >
              <FaSignOutAlt className={`${sidebarCollapsed ? "" : "mr-3"} text-red-400`} />
              {!sidebarCollapsed && <span className="text-sm">Logout</span>}
            </button>
          </div>

          {/* FOOTER */}
          {!sidebarCollapsed && (
            <div className="mt-4 pt-4 border-t border-purple-500/10 text-center">
              <p className="text-gry-400 text-xs mb-3">
                &copy; {new Date().getFullYear()} Skill Scanner
              </p>
              <div className="flex justify-center space-x-4 text-xs text-gray-500">
                <Link href="/privacy" className="hover:text-purple-400">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-purple-400">
                  Terms
                </Link>
                <Link href="/contact" className="hover:text-purple-400">
                  Contact
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[50]"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
