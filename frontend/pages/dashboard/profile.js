import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import withAuth from "../../lib/withAuth";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const ProfilePage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    qualification: "",
    recentStudied: "",
    gender: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") setSidebarCollapsed(true);

    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("email");
    if (userId) {
      fetchProfile(userId);
      // Set email from localStorage immediately
      setProfile((prev) => ({ ...prev, email: userEmail || "" }));
      checkProfileCompletion(userId);
    }
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(`/api/get-profile?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile((prev) => ({ ...prev, ...data.profile }));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setErrorMsg("Failed to load profile");
    }
  };

  const checkProfileCompletion = async (userId) => {
    try {
      const res = await fetch(`/api/check-profile-complete?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setProfileComplete(data.isComplete);
      }
    } catch (err) {
      console.error("Error checking profile completion:", err);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...profile }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Profile updated successfully!");
        // Update localStorage name if changed
        if (profile.fullName) {
          localStorage.setItem("name", profile.fullName);
        }

        // Check if profile is now complete
        const checkRes = await fetch(
          `/api/check-profile-complete?userId=${userId}`
        );
        const checkData = await checkRes.json();

        if (checkData.success && checkData.isComplete) {
          setSuccessMsg(
            "Profile updated successfully! Your profile is now complete."
          );
          setProfileComplete(true);
        } else {
          setSuccessMsg(
            "Profile updated successfully! Please complete all required fields."
          );
          setProfileComplete(false);
        }
      } else {
        setErrorMsg(data.message || "Failed to update profile.");
      }
    } catch {
      setErrorMsg("Network error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (successMsg) setSuccessMsg("");
    if (errorMsg) setErrorMsg("");
  };

  return (
    <>
      <Head>
        <title>My Profile - Skill Scanner</title>
        <meta
          name="description"
          content="Manage your profile information on Skill Scanner"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            handleLogout={handleLogout}
          />

          <div
            className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? "ml-20" : "ml-0 md:ml-72"
            } p-4 md:p-6`}
          >
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    My Profile
                  </h1>
                  <p className="text-gray-300 text-sm md:text-base">
                    Manage your personal information and account settings
                  </p>
                </div>

                {/* Profile Completion Status */}
                {!profileComplete && (
                  <div className="flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-4 py-3">
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="text-yellow-300 text-sm font-medium">
                      Complete your profile to be visible to interviewers
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">
                    Personal Information
                  </h2>
                </div>

                {[
                  {
                    key: "fullName",
                    label: "Full Name",
                    type: "text",
                    placeholder: "Enter your full name",
                    required: true,
                  },
                  {
                    key: "email",
                    label: "Email Address",
                    type: "email",
                    placeholder: "your.email@example.com",
                    disabled: true,
                  },
                  {
                    key: "phone",
                    label: "Phone Number",
                    type: "tel",
                    placeholder: "+1 (555) 123-4567",
                    required: true,
                  },
                  {
                    key: "gender",
                    label: "Gender",
                    type: "select",
                    options: [
                      "",
                      "Male",
                      "Female",
                      "Other",
                      "Prefer not to say",
                    ],
                    required: true,
                  },
                  {
                    key: "qualification",
                    label: "Highest Qualification",
                    type: "text",
                    placeholder: "e.g., Bachelor's Degree",
                    required: true,
                  },
                  {
                    key: "recentStudied",
                    label: "Recent Education",
                    type: "text",
                    placeholder: "e.g., University Name",
                    required: true,
                  },
                ].map(
                  ({
                    key,
                    label,
                    type,
                    placeholder,
                    options,
                    disabled,
                    required,
                  }) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        {label}{" "}
                        {required && <span className="text-red-400">*</span>}
                      </label>
                      {type === "select" ? (
                        <select
                          value={profile[key] || ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                          disabled={disabled}
                        >
                          {options.map((option) => (
                            <option
                              key={option}
                              value={option}
                              className="text-gray-800"
                            >
                              {option || "Select gender"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={profile[key] || ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          disabled={disabled}
                          className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 ${
                            disabled ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        />
                      )}
                    </div>
                  )
                )}

                {/* Address */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Address
                  </label>
                  <textarea
                    placeholder="Enter your complete address"
                    value={profile.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 resize-none"
                  />
                </div>

                {/* Bio */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Bio
                  </label>
                  <textarea
                    placeholder="Tell us about yourself, your skills, and experience..."
                    value={profile.bio || ""}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              {/* Required Fields Note */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-blue-300 text-sm font-medium mb-1">
                      Profile Completion Required
                    </p>
                    <p className="text-blue-200 text-xs">
                      Fields marked with <span className="text-red-400">*</span>{" "}
                      are required to complete your profile. Interviewers can
                      only see candidates with complete profiles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio Importance Note */}
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-purple-300 text-sm font-medium mb-1">
                      Enhance Your Profile with a Bio
                    </p>
                    <p className="text-purple-200 text-xs">
                      Adding a detailed bio helps AI match you with the most
                      relevant interviewers. Include your skills, experience,
                      projects, and career interests for better matching
                      results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 md:mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  {successMsg && (
                    <div className="flex items-center space-x-2 text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">{successMsg}</span>
                    </div>
                  )}
                  {errorMsg && (
                    <div className="flex items-center space-x-2 text-red-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">{errorMsg}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => router.back()}
                    className="px-6 py-3 text-gray-300 hover:text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Update Profile"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default withAuth(ProfilePage);
