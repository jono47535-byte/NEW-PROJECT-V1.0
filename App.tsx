import React, { useState, useEffect } from 'react';
import HackerLogin from './components/HackerLogin';
import GameOverlay from './components/GameOverlay';
import AdminDashboard from './components/AdminDashboard';
import { getSettings } from './services/mockDatabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [gameUrl, setGameUrl] = useState('https://dkwin9.com/#/register?invitationCode=565341307515');

  useEffect(() => {
    // Load initial settings
    const settings = getSettings();
    setGameUrl(settings.gameUrl);
  }, [isAuthenticated]); // Reload settings when login state changes

  const handleLoginSuccess = () => {
    // Refresh settings before entering game
    const settings = getSettings();
    setGameUrl(settings.gameUrl);
    setIsAuthenticated(true);
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsAuthenticated(false);
  };

  // 1. Admin View
  if (isAdmin) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // 2. Login View
  if (!isAuthenticated) {
    return <HackerLogin onLoginSuccess={handleLoginSuccess} onAdminLogin={handleAdminLogin} />;
  }

  // 3. Game View (Authenticated User)
  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* 
        Full Screen Iframe 
        Using key to force re-render if URL changes
      */}
      <iframe 
        key={gameUrl}
        src={gameUrl} 
        className="absolute inset-0 w-full h-full border-0 z-0"
        title="Game Platform"
        allow="autoplay"
      />

      {/* 
        Fallback background if iframe fails to load or is blocked
      */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 text-gray-700 font-bold text-4xl pointer-events-none">
        GAME PLATFORM LOADING...
      </div>

      {/* The Draggable Hack Overlay */}
      <GameOverlay />
    </div>
  );
};

export default App;