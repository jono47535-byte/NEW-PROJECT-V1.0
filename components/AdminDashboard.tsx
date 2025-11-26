
import React, { useState, useEffect } from 'react';
import { UserData, AccessStatus } from '../types';
import { getAllUsers, approveUser, changeUserStatus, getSettings, updateSettings } from '../services/mockDatabase';
import { playClickSound, playSuccessSound, playErrorSound } from '../services/soundService';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'USERS' | 'SETTINGS'>('REQUESTS');
  
  // Settings State
  const [gameUrl, setGameUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // Poll for new requests
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setUsers(getAllUsers());
    const settings = getSettings();
    // Only update inputs if the user isn't currently typing in them to avoid cursor jumping
    // This is a simple check; in a real app, you'd separate form state from DB state more strictly.
    if (!document.activeElement?.id?.includes('Input')) {
        if (!gameUrl) setGameUrl(settings.gameUrl);
        if (!appName) setAppName(settings.appName);
        if (!adminPassword) setAdminPassword(settings.adminPassword || 'ADMIN123');
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleTabChange = (tab: 'REQUESTS' | 'USERS' | 'SETTINGS') => {
    playClickSound();
    setActiveTab(tab);
  };

  const handleApprove = (deviceId: string) => {
    playSuccessSound();
    const code = approveUser(deviceId);
    showNotification(`User Approved! Code: ${code}`);
    loadData();
  };

  const handleBlock = (deviceId: string) => {
    playErrorSound();
    changeUserStatus(deviceId, AccessStatus.BLOCKED);
    showNotification(`Device ${deviceId} BLOCKED.`);
    loadData();
  };

  const handleUnblock = (deviceId: string) => {
    playClickSound();
    changeUserStatus(deviceId, AccessStatus.LOCKED);
    showNotification(`Device ${deviceId} Unblocked.`);
    loadData();
  };

  const handleSaveSettings = () => {
    playSuccessSound();
    updateSettings({ gameUrl, appName, adminPassword });
    showNotification('System Configuration Updated Successfully.');
  };

  const pendingUsers = users.filter(u => u.status === AccessStatus.PENDING);
  const activeUsers = users.filter(u => u.status === AccessStatus.GRANTED);
  const blockedUsers = users.filter(u => u.status === AccessStatus.BLOCKED);

  return (
    <div className="min-h-screen bg-gray-900 text-green-500 font-mono p-4 md:p-8 bg-[url('https://picsum.photos/id/108/1920/1080?grayscale&blur=2')] bg-cover bg-fixed relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-green-500/30 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-900/30 rounded-full border border-green-500 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                <span className="text-2xl">⚡</span>
            </div>
            <div>
                <h1 className="text-3xl font-bold hack-font neon-text text-white">ADMIN DASHBOARD</h1>
                <p className="text-xs text-green-400 tracking-widest">ROOT PRIVILEGES: ACTIVE</p>
            </div>
          </div>
          <button 
            onClick={() => { playClickSound(); onLogout(); }}
            className="bg-red-900/20 border border-red-500/50 text-red-400 px-6 py-2 rounded hover:bg-red-900/50 transition shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] text-sm font-bold tracking-wider focus:shadow-[0_0_20px_rgba(255,0,0,0.6)]"
          >
            TERMINATE SESSION
          </button>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-black/40 p-2 rounded-lg border border-green-900/50 inline-flex">
             <button 
                onClick={() => handleTabChange('REQUESTS')}
                className={`px-6 py-2 rounded transition-all duration-300 font-bold text-sm tracking-widest focus:outline-none ${activeTab === 'REQUESTS' ? 'bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-gray-400 hover:text-green-400'}`}
             >
                REQUESTS ({pendingUsers.length})
             </button>
             <button 
                onClick={() => handleTabChange('USERS')}
                className={`px-6 py-2 rounded transition-all duration-300 font-bold text-sm tracking-widest focus:outline-none ${activeTab === 'USERS' ? 'bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-gray-400 hover:text-green-400'}`}
             >
                USERS ({activeUsers.length})
             </button>
             <button 
                onClick={() => handleTabChange('SETTINGS')}
                className={`px-6 py-2 rounded transition-all duration-300 font-bold text-sm tracking-widest focus:outline-none ${activeTab === 'SETTINGS' ? 'bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-gray-400 hover:text-green-400'}`}
             >
                SETTINGS
             </button>
        </div>

        {/* Notification */}
        {notification && (
            <div className="fixed top-6 right-6 bg-black/90 text-green-400 px-6 py-4 rounded border-l-4 border-green-500 shadow-2xl z-50 animate-bounce flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                {notification}
            </div>
        )}

        {/* Content Container */}
        <div className="bg-black/60 backdrop-blur-md border border-green-500/20 rounded-xl p-6 shadow-xl min-h-[500px]">
            
            {/* REQUESTS TAB */}
            {activeTab === 'REQUESTS' && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl text-white font-bold tracking-wider border-l-4 border-yellow-500 pl-3">PENDING ACCESS REQUESTS</h2>
                     <div className="text-xs text-gray-500">AUTO-REFRESHING...</div>
                </div>

                {pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                    <div className="text-4xl mb-4 opacity-50">🛡️</div>
                    <p className="italic">No pending requests in queue.</p>
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="text-gray-400 text-xs border-b border-gray-800 uppercase tracking-wider">
                            <th className="p-4">Device Identifier</th>
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Controls</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm">
                        {pendingUsers.map(user => (
                            <tr key={user.deviceId} className="border-b border-gray-800/50 hover:bg-green-900/10 transition-colors group">
                            <td className="p-4 font-mono font-bold text-white group-hover:text-green-400 transition-colors">{user.deviceId}</td>
                            <td className="p-4 text-gray-400">{new Date(user.requestTime).toLocaleTimeString()}</td>
                            <td className="p-4"><span className="bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded text-xs border border-yellow-700/50">WAITING</span></td>
                            <td className="p-4 flex gap-3 justify-end">
                                <button 
                                onClick={() => handleApprove(user.deviceId)}
                                className="bg-green-600/20 text-green-400 border border-green-600/50 px-4 py-1.5 rounded hover:bg-green-500 hover:text-black transition-all font-bold text-xs"
                                >
                                ACCEPT
                                </button>
                                <button 
                                onClick={() => handleBlock(user.deviceId)}
                                className="bg-red-900/20 text-red-400 border border-red-800/50 px-4 py-1.5 rounded hover:bg-red-600 hover:text-white transition-all font-bold text-xs"
                                >
                                DENY
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'USERS' && (
            <div className="animate-fade-in space-y-10">
                <div>
                    <h2 className="text-xl text-white font-bold tracking-wider border-l-4 border-green-500 pl-3 mb-6">ONLINE OPERATIVES</h2>
                    <div className="overflow-x-auto bg-black/20 rounded-lg border border-gray-800">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50">
                                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-4">Device ID</th>
                                    <th className="p-4">Access Key</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-800/50">
                                {activeUsers.map(user => (
                                    <tr key={user.deviceId} className="hover:bg-green-900/5 transition-colors">
                                        <td className="p-4 font-mono text-gray-300">{user.deviceId}</td>
                                        <td className="p-4 font-mono text-yellow-400 font-bold tracking-widest">{user.activationCode}</td>
                                        <td className="p-4"><span className="flex items-center gap-2 text-green-500 text-xs font-bold"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ACTIVE</span></td>
                                        <td className="p-4 text-right">
                                            <button 
                                            onClick={() => handleBlock(user.deviceId)}
                                            className="text-red-500 hover:text-red-300 border border-red-900/50 px-3 py-1 rounded text-xs hover:bg-red-900/20 transition-colors"
                                            >
                                            REVOKE ACCESS
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {activeUsers.length === 0 && <div className="p-8 text-center text-gray-600 italic">No active users found.</div>}
                    </div>
                </div>

                {blockedUsers.length > 0 && (
                    <div>
                        <h2 className="text-xl text-red-500 font-bold tracking-wider border-l-4 border-red-500 pl-3 mb-6">BLACKLISTED DEVICES</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {blockedUsers.map(user => (
                                <div key={user.deviceId} className="bg-red-900/10 border border-red-900/30 p-4 rounded flex justify-between items-center group hover:border-red-500/50 transition-colors">
                                    <div>
                                        <div className="font-mono text-gray-400 text-sm line-through decoration-red-500 decoration-2">{user.deviceId}</div>
                                        <div className="text-[10px] text-red-700 font-bold mt-1">BANNED</div>
                                    </div>
                                    <button 
                                        onClick={() => handleUnblock(user.deviceId)}
                                        className="text-gray-500 hover:text-green-400 transition-colors text-xs border border-gray-800 px-2 py-1 rounded hover:border-green-500"
                                    >
                                        RESTORE
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'SETTINGS' && (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <h2 className="text-xl text-white font-bold tracking-wider border-l-4 border-blue-500 pl-3 mb-8">SYSTEM CONFIGURATION</h2>
                
                <div className="space-y-8">
                    {/* General Settings */}
                    <div className="bg-black/40 p-6 rounded-lg border border-gray-800">
                        <h3 className="text-green-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                             <span>🖥️</span> Interface Settings
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-2 uppercase">App Display Name</label>
                                <input 
                                    id="nameInput"
                                    type="text" 
                                    value={appName}
                                    onChange={(e) => setAppName(e.target.value)}
                                    className="w-full bg-gray-900/80 border border-gray-700 p-3 text-white focus:border-green-400 focus:shadow-[0_0_10px_rgba(74,222,128,0.5)] outline-none font-bold text-lg rounded transition-all"
                                    placeholder="BOSS MURAD VIP"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2 uppercase">Game Iframe URL</label>
                                <input 
                                    id="urlInput"
                                    type="text" 
                                    value={gameUrl}
                                    onChange={(e) => setGameUrl(e.target.value)}
                                    className="w-full bg-gray-900/80 border border-gray-700 p-3 text-gray-300 focus:border-green-400 focus:shadow-[0_0_10px_rgba(74,222,128,0.2)] outline-none text-sm font-mono rounded transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-red-900/5 p-6 rounded-lg border border-red-900/20">
                         <h3 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                             <span>🔒</span> Admin Security
                        </h3>
                        
                        <div>
                             <label className="block text-xs text-gray-400 mb-2 uppercase">Admin Password</label>
                             <div className="relative">
                                <input 
                                    id="passwordInput"
                                    type="text" 
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full bg-gray-900/80 border border-red-900/50 p-3 text-white focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.5)] outline-none font-mono text-lg rounded transition-all pl-10"
                                    placeholder="Enter new password"
                                />
                                <span className="absolute left-3 top-3.5 text-gray-500">🔑</span>
                             </div>
                             <p className="text-[10px] text-gray-500 mt-2">
                                Warning: Changing this will revoke access for the old password immediately.
                             </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleSaveSettings}
                            className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 rounded shadow-lg transform hover:-translate-y-1 transition-all duration-200 neon-border flex items-center justify-center gap-2 focus:shadow-[0_0_20px_#22c55e] focus:outline-none"
                        >
                            <span>💾</span> SAVE ALL CHANGES
                        </button>
                    </div>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
