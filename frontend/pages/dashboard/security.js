import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import withAuth from '../../lib/withAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from "../../components/Navbar";

const SecurityPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    device_management: true,
    suspicious_activity_detection: true
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') setSidebarCollapsed(true);
    
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const [settingsRes, activityRes] = await Promise.all([
        fetch(`/api/get-security-settings?userId=${userId}`),
        fetch(`/api/get-activity-logs?userId=${userId}`)
      ]);

      const settingsData = await settingsRes.json();
      const activityData = await activityRes.json();

      if (settingsData.success) setSecuritySettings(settingsData.settings || securitySettings);
      if (activityData.success) setActivityLogs(activityData.logs || []);

      // Mock devices data
      setDevices([
        {
          id: 1,
          name: 'Chrome on Windows',
          type: 'desktop',
          last_active: new Date().toISOString(),
          location: 'New York, US',
          current: true
        },
        {
          id: 2,
          name: 'Safari on iPhone',
          type: 'mobile',
          last_active: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Chicago, US',
          current: false
        }
      ]);
    } catch (error) {
      console.error('Error fetching security data:', error);
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

  const handleSettingChange = (setting, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    setSuccessMsg('');
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/update-security-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...securitySettings
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Security settings updated successfully!');
      } else {
        setSuccessMsg('Failed to update settings.');
      }
    } catch (error) {
      setSuccessMsg('Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  const revokeDevice = (deviceId) => {
    setDevices(prev => prev.filter(device => device.id !== deviceId));
    setSuccessMsg('Device access revoked successfully!');
  };

  const getActivityStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
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
        <title>Security - Skill Scanner</title>
        <meta name="description" content="Manage your account security settings" />
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
                Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">Security</span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                Manage your security settings and monitor account activity
              </p>
            </div>

            {/* Tabs */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 mb-6">
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'settings'
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Security Settings
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'activity'
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Activity Log
                </button>
                <button
                  onClick={() => setActiveTab('devices')}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'devices'
                      ? 'text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Devices
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-400">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.two_factor_enabled}
                        onChange={(e) => handleSettingChange('two_factor_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">Login Alerts</div>
                      <div className="text-sm text-gray-400">
                        Get notified of new sign-ins from unrecognized devices
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.login_alerts}
                        onChange={(e) => handleSettingChange('login_alerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">Device Management</div>
                      <div className="text-sm text-gray-400">
                        Monitor and manage devices that have access to your account
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.device_management}
                        onChange={(e) => handleSettingChange('device_management', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">Suspicious Activity Detection</div>
                      <div className="text-sm text-gray-400">
                        Automatically detect and alert you about suspicious activities
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.suspicious_activity_detection}
                        onChange={(e) => handleSettingChange('suspicious_activity_detection', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
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
                    <button
                      onClick={saveSettings}
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
              )}

              {activeTab === 'activity' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                    <span className="text-gray-400 text-sm">
                      {activityLogs.length} activities
                    </span>
                  </div>

                  {activityLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No activity yet</h3>
                      <p className="text-gray-400 text-sm">
                        Your account activity will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-white">{log.activity_type}</div>
                              <div className="text-sm text-gray-400">
                                {log.location && `${log.location} • `}{new Date(log.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActivityStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'devices' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Connected Devices</h2>
                    <span className="text-gray-400 text-sm">
                      {devices.length} devices
                    </span>
                  </div>

                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-white">{device.name}</div>
                            <div className="text-sm text-gray-400">
                              {device.location} • Last active: {new Date(device.last_active).toLocaleDateString()}
                              {device.current && (
                                <span className="ml-2 text-green-400">• Current device</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!device.current && (
                          <button
                            onClick={() => revokeDevice(device.id)}
                            className="px-4 py-2 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-xl text-sm font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-yellow-400 font-medium mb-1">Device Security Tips</h4>
                        <p className="text-yellow-300 text-sm">
                          Regularly review your connected devices and revoke access for any you don't recognize. 
                          Make sure to log out from shared devices and keep your software updated.
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

export default withAuth(SecurityPage);