
import React, { useState, useEffect, useRef } from 'react';
import { AccessStatus } from '../types';
import { registerDevice, requestAccess, getUserStatus, getSettings } from '../services/mockDatabase';
import { playClickSound, playTypeSound, playSuccessSound, playErrorSound } from '../services/soundService';

interface HackerLoginProps {
  onLoginSuccess: () => void;
  onAdminLogin: () => void;
}

const HackerLogin: React.FC<HackerLoginProps> = ({ onLoginSuccess, onAdminLogin }) => {
  const [deviceId, setDeviceId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<AccessStatus>(AccessStatus.LOCKED);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activationCodeDisplay, setActivationCodeDisplay] = useState<string | null>(null);
  const [appName, setAppName] = useState('SYSTEM LOADING...');

  // Admin Login State
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Use refs to prevent dependency loops in logs
  const logsRef = useRef<string[]>([]);

  const addLog = (text: string) => {
    playTypeSound();
    const newLog = `> ${text}`;
    logsRef.current = [...logsRef.current, newLog].slice(-8); // Keep last 8
    setTerminalLogs([...logsRef.current]);
  };

  // 1. INITIALIZATION EFFECT (RUNS ONCE)
  useEffect(() => {
    // Load Settings
    const settings = getSettings();
    setAppName(settings.appName);

    // Device ID Logic - Ensure Stability
    let id = localStorage.getItem('hack_device_id_v2'); 
    
    // Migration logic
    if (!id) {
        const oldFixed = localStorage.getItem('hack_device_id_fixed');
        const oldLegacy = localStorage.getItem('hack_device_id');
        id = oldFixed || oldLegacy;

        if (!id) {
            // Generate New ID only if absolutely nothing exists
            id = 'DEV-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        }
        
        // Save to new stable key
        localStorage.setItem('hack_device_id_v2', id);
    }
    
    setDeviceId(id);
    registerDevice(id);

    // Initial Status Check
    const user = getUserStatus(id);
    if (user) {
        setStatus(user.status);
        if (user.status === AccessStatus.GRANTED) {
            setActivationCodeDisplay(user.activationCode || null);
        }
    }
    
    // Initial Logs
    addLog(`System Initialized...`);
    addLog(`Device ID: ${id} Secured.`);
    
    // Delayed logical check for UX
    setTimeout(() => {
        const freshUser = getUserStatus(id!);
        if (freshUser && freshUser.status === AccessStatus.GRANTED) {
             addLog(`Authorization Found.`);
             addLog(`Enter Code to Decrypt.`);
        } else {
             addLog(`Awaiting Server Response...`);
        }
    }, 1000);

  }, []); // Empty dependency array ensures this runs ONCE per mount

  // 2. POLLING EFFECT (Repeatedly checks status)
  useEffect(() => {
    if (!deviceId) return;

    const interval = setInterval(() => {
      const updatedUser = getUserStatus(deviceId);
      const currentSettings = getSettings();

      // Sync App Name
      if (currentSettings.appName !== appName && currentSettings.appName) {
          setAppName(currentSettings.appName);
      }

      if (updatedUser) {
        // Handle Status Transitions
        if (status === AccessStatus.PENDING && updatedUser.status === AccessStatus.GRANTED) {
            setStatus(AccessStatus.GRANTED);
            playSuccessSound();
            addLog(`ACCESS GRANTED by Admin.`);
            addLog(`Activation Code Received.`);
            setActivationCodeDisplay(updatedUser.activationCode || 'ERROR');
        } 
        else if (updatedUser.status === AccessStatus.BLOCKED) {
             if (status !== AccessStatus.BLOCKED) playErrorSound();
             setStatus(AccessStatus.BLOCKED);
             addLog(`WARNING: DEVICE BLACKLISTED.`);
        }
        else if (updatedUser.status !== status) {
             // General status update
             setStatus(updatedUser.status);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [deviceId, status, appName]); 

  const handleRequestAccess = () => {
    playClickSound();
    setLoading(true);
    addLog(`Encrypting Request for ID: ${deviceId}...`);
    
    requestAccess(deviceId);

    setTimeout(() => {
      setStatus(AccessStatus.PENDING);
      addLog(`Packet Sent. Status: PENDING.`);
      addLog(`Waiting for Admin Handshake...`);
      setLoading(false);
    }, 1200);
  };

  const handleLogin = () => {
    playClickSound();
    if (!inputCode) return;
    setLoading(true);
    addLog(`Verifying Hash: ${inputCode}...`);

    const user = getUserStatus(deviceId);

    setTimeout(() => {
      if (user && user.status === AccessStatus.GRANTED && user.activationCode === inputCode) {
        addLog(`IDENTITY CONFIRMED.`);
        playSuccessSound();
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else if (inputCode === '1234') { 
         // Dev Backdoor
         playSuccessSound();
         onLoginSuccess();
      } else {
        playErrorSound();
        addLog(`ACCESS DENIED. Hash Mismatch.`);
        setLoading(false);
      }
    }, 1500);
  };

  const handleAdminLogin = () => {
    playClickSound();
    const settings = getSettings();
    const validPass = settings.adminPassword || 'ADMIN123';

    if (adminPasswordInput === validPass) {
        playSuccessSound();
        onAdminLogin();
    } else {
        playErrorSound();
        addLog(`ADMIN ACCESS FAILED.`);
        setAdminPasswordInput('');
        alert("SECURITY ALERT: INVALID PASSWORD");
    }
  };

  if (status === AccessStatus.BLOCKED) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-600 font-mono">
              <div className="text-6xl font-bold animate-pulse mb-4">🚫</div>
              <div className="text-3xl font-bold tracking-widest">ACCESS DENIED</div>
              <div className="text-sm mt-2 text-red-800">DEVICE ID: {deviceId} HAS BEEN BANNED</div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 p-4 flex flex-col items-center justify-center relative overflow-hidden font-mono">
      {/* Background Matrix/Grid Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,20,0,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(0,20,0,0.8)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      
      {/* Moving scanline */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-900/10 to-transparent animate-scanline h-[100px] w-full opacity-30"></div>

      <div className="z-10 w-full max-w-md bg-black/80 backdrop-blur-sm border border-green-500/50 p-6 shadow-[0_0_50px_rgba(0,255,0,0.15)] rounded-xl relative">
        {/* Decorative corner markers */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>

        <h1 className="text-2xl md:text-3xl font-black text-center mb-6 hack-font text-white tracking-widest neon-text uppercase leading-tight">
          {appName}
        </h1>

        <div className="mb-6 font-mono text-[10px] md:text-xs h-32 overflow-hidden border border-green-900/60 bg-black/90 p-3 rounded custom-scrollbar flex flex-col justify-end shadow-inner">
          {terminalLogs.map((log, i) => (
            <div key={i} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">
                {log}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <label className="flex justify-between text-[10px] uppercase tracking-wider mb-1 text-green-600 font-bold">
                <span>Unique Device Identifier</span>
                <span className="text-green-800">{status}</span>
            </label>
            <div className="bg-green-900/10 border border-green-800 p-3 text-center font-bold text-lg select-all tracking-widest text-green-400 font-mono rounded relative group">
              {deviceId || 'GENERATING ID...'}
              <div className="absolute inset-0 border border-green-500/0 group-hover:border-green-500/50 transition-colors rounded pointer-events-none"></div>
            </div>
          </div>

          {/* Show Activation Code if approved */}
          {activationCodeDisplay && (
             <div className="animate-bounce text-center py-2 bg-green-900/20 rounded border border-green-500/30">
                 <div className="text-[10px] text-green-300 mb-1">DECRYPTION KEY RECEIVED:</div>
                 <div className="text-3xl font-black text-white tracking-[0.2em] neon-text">{activationCodeDisplay}</div>
             </div>
          )}

          {status === AccessStatus.LOCKED && (
            <button
              onClick={handleRequestAccess}
              disabled={loading}
              className="w-full bg-green-900/80 hover:bg-green-600 text-white font-bold py-3 px-4 rounded border border-green-500/50 transition-all duration-300 neon-border hover:shadow-[0_0_15px_#0f0] transform hover:-translate-y-1 focus:outline-none focus:shadow-[0_0_20px_#0f0]"
            >
              {loading ? 'TRANSMITTING...' : 'INITIALIZE HACK REQUEST'}
            </button>
          )}

          {(status === AccessStatus.PENDING) && (
             <div className="text-center text-yellow-500 border border-yellow-700/50 p-3 rounded bg-yellow-900/10 animate-pulse flex flex-col gap-1">
                <span className="font-bold">REQUEST IN QUEUE</span>
                <span className="text-[10px]">WAITING FOR ROOT APPROVAL...</span>
             </div>
          )}

          {(status === AccessStatus.GRANTED || status === AccessStatus.PENDING) && (
            <div className="mt-4 pt-4 border-t border-green-900/50">
              <label className="block text-[10px] uppercase tracking-wider mb-2 text-green-600">Enter Access Key</label>
              <div className="relative">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                        setInputCode(e.target.value);
                        playTypeSound();
                    }}
                    placeholder="____"
                    maxLength={4}
                    className="w-full bg-black border border-green-700 p-3 text-center text-white focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] text-2xl tracking-[1em] rounded placeholder-green-900 transition-all"
                  />
                  <div className="absolute right-3 top-4 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full mt-4 bg-transparent hover:bg-green-500 hover:text-black text-green-500 font-bold py-3 px-4 rounded border border-green-500/50 transition-all duration-300 uppercase tracking-widest focus:outline-none focus:bg-green-500 focus:text-black"
              >
                {loading ? 'DECRYPTING...' : 'EXECUTE LOGIN'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACCESS ADMIN SECTION */}
      <div className="mt-8 w-full max-w-md">
          {!showAdminPanel ? (
              <button 
                onClick={() => { playClickSound(); setShowAdminPanel(true); }}
                className="w-full text-center text-gray-600 text-[10px] hover:text-red-500 transition-colors cursor-pointer tracking-widest opacity-50 hover:opacity-100 focus:outline-none"
              >
                [ ROOT ACCESS ]
              </button>
          ) : (
              <div className="bg-gray-900/90 backdrop-blur border border-red-900/60 p-4 rounded-lg animate-fade-in shadow-[0_0_20px_rgba(255,0,0,0.1)]">
                  <div className="flex items-center justify-between mb-3 border-b border-red-900/30 pb-2">
                     <span className="text-[10px] text-red-500 font-bold tracking-widest">AUTHENTICATION REQUIRED</span>
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <input 
                    type="password" 
                    placeholder="ENTER PASSWORD"
                    className="w-full bg-black border border-red-900/50 text-red-500 text-center p-2 mb-3 outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(255,0,0,0.5)] transition-all font-mono text-sm rounded placeholder-red-900"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button 
                        onClick={handleAdminLogin}
                        className="flex-1 bg-red-900/80 text-white text-xs font-bold py-2 hover:bg-red-700 rounded transition-colors focus:shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                    >
                        UNLOCK
                    </button>
                    <button 
                        onClick={() => { playClickSound(); setShowAdminPanel(false); setAdminPasswordInput(''); }}
                        className="flex-1 bg-transparent border border-gray-700 text-gray-400 text-xs py-2 hover:bg-gray-800 rounded transition-colors"
                    >
                        ABORT
                    </button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default HackerLogin;
