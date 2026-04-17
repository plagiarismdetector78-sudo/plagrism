import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import withAuth from "../../lib/withAuth";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const SettingsPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    darkMode: true,
    language: "English",
    twoFactorAuth: false,
    autoSave: true,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const savedSidebar = localStorage.getItem("sidebarCollapsed");
    if (savedSidebar === "true") setSidebarCollapsed(true);

    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setSuccessMsg("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");

    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("userSettings", JSON.stringify(settings));
      setSuccessMsg("Settings saved successfully!");
      setSaving(false);
    }, 1500);
  };

  const handleReset = () => {
    const defaultSettings = {
      notifications: true,
      emailNotifications: true,
      darkMode: true,
      language: "English",
      twoFactorAuth: false,
      autoSave: true,
    };
    setSettings(defaultSettings);
    setSuccessMsg("Settings reset to defaults!");
  };

  return (
    <>
      <Head>
        <title>Settings - Skill Scanner</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={handleToggleSidebar}
            handleLogout={handleLogout}
          />
          <div
            className={`flex-1 transition-all duration-300 ${
              sidebarCollapsed ? "ml-20" : "ml-0 md:ml-72"
            } p-4 md:p-6`}
          >
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-300 text-sm md:text-base">
                Customize your experience and manage account preferences
              </p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6 max-w-4xl">
              <div className="space-y-8">
                {/* Notification Settings */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">
                    Notification Settings
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: 'notifications', label: 'Push Notifications', description: 'Receive browser notifications for interviews and updates' },
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Get important updates via email' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex-1">
                          <div className="font-medium text-white">{label}</div>
                          <div className="text-sm text-gray-400 mt-1">{description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[key]}
                            onChange={(e) => handleChange(key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Settings */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">
                    Security
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: 'twoFactorAuth', label: 'Two-Factor Authentication', description: 'Add an extra layer of security to your account' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex-1">
                          <div className="font-medium text-white">{label}</div>
                          <div className="text-sm text-gray-400 mt-1">{description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[key]}
                            onChange={(e) => handleChange(key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Settings */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/10">
                    Application
                  </h2>
                  <div className="space-y-4">
                    {/* Language */}
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <label className="block text-sm font-medium text-white mb-3">
                        Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleChange('language', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                      >
                        <option className="text-gray-800">English</option>
                        <option className="text-gray-800">Spanish</option>
                        <option className="text-gray-800">French</option>
                        <option className="text-gray-800">German</option>
                        <option className="text-gray-800">Chinese</option>
                      </select>
                    </div>

                    {/* Auto Save */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="flex-1">
                        <div className="font-medium text-white">Auto Save</div>
                        <div className="text-sm text-gray-400 mt-1">Automatically save your progress during interviews</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoSave}
                          onChange={(e) => handleChange('autoSave', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                  <div className="flex-1">
                    {successMsg && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{successMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 text-gray-300 hover:text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300"
                    >
                      Reset to Defaults
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {saving ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        'Save Settings'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default withAuth(SettingsPage);