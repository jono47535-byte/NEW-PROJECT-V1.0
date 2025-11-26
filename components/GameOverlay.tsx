
import React, { useState, useEffect, useRef } from 'react';
import { fetchPredictionData } from '../services/predictionService';
import { getSettings } from '../services/mockDatabase';
import { playSignalSound } from '../services/soundService';
import { PredictionResult } from '../types';

const GameOverlay: React.FC = () => {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [countdown, setCountdown] = useState(0);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [appName, setAppName] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  
  // Track previous period to play sound only on change
  const prevPeriodRef = useRef<string>('');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (overlayRef.current) {
        const rect = overlayRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Data Fetching Logic (Polling every second)
  useEffect(() => {
    const settings = getSettings();
    setAppName(settings.appName);

    const fetchData = async () => {
      try {
        const data = await fetchPredictionData();
        setCountdown(data.countdown);
        setLoading(false);

        // Logic: Show "Analyzing" for the first 5 seconds of a new period (Countdown 30 to 25)
        // This makes the user feel like the hack is working
        if (data.countdown > 25) {
            setIsAnalyzing(true);
            setPrediction(null); // Hide prediction while analyzing
        } else {
            setIsAnalyzing(false);
            setPrediction(data.prediction);
            
            // Check if period changed to play sound
            if (data.prediction && data.prediction.period !== prevPeriodRef.current) {
                prevPeriodRef.current = data.prediction.period;
                // Play notification sound
                playSignalSound();
                // Trigger visual flash
                setShowFlash(true);
                setTimeout(() => setShowFlash(false), 800); // Longer flash
            }
        }

      } catch (error) {
        console.error("Failed to fetch prediction", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine flash colors based on result
  const getFlashColor = () => {
      if (!prediction) return 'bg-white';
      return prediction.result === 'BIG' ? 'bg-yellow-400' : 'bg-blue-400';
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 9999,
      }}
      onMouseDown={handleMouseDown}
      className={`w-64 bg-black/90 backdrop-blur-md border-2 rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.4)] overflow-hidden select-none transition-all duration-300 
        ${showFlash ? `border-white ${getFlashColor()} bg-opacity-80 scale-105` : 'border-green-500'}
      `}
    >
      {/* Header */}
      <div className="bg-green-900/50 p-2 flex items-center justify-between border-b border-green-500">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-ping' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-xs font-bold text-white hack-font truncate max-w-[150px]">{appName}</span>
        </div>
        <div className="text-[10px] text-green-300">SYSTEM: ONLINE</div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col items-center relative">
        {/* Flash Overlay Effect */}
        {showFlash && <div className="absolute inset-0 bg-white opacity-20 animate-pulse z-0"></div>}

        {/* Timer Circle */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-4 z-10">
           <svg className="absolute w-full h-full transform -rotate-90">
             <circle
               cx="40"
               cy="40"
               r="36"
               stroke="#1a2e1a"
               strokeWidth="4"
               fill="transparent"
             />
             <circle
               cx="40"
               cy="40"
               r="36"
               stroke={countdown <= 5 ? '#ef4444' : '#22c55e'}
               strokeWidth="4"
               fill="transparent"
               strokeDasharray={226}
               strokeDashoffset={226 - (226 * countdown) / 30}
               className="transition-all duration-1000 ease-linear"
             />
           </svg>
           <span className={`text-2xl font-bold font-mono ${countdown <= 5 ? 'text-red-500' : 'text-green-500'}`}>
             {countdown.toString().padStart(2, '0')}
           </span>
        </div>

        {/* Prediction Display */}
        {loading ? (
            <div className="text-green-500 animate-pulse text-xs z-10">CONNECTING SERVER...</div>
        ) : (
            <div className="w-full text-center space-y-2 z-10">
                
                {/* Period Display */}
                <div className="flex justify-between text-[10px] text-gray-400 font-mono border-b border-gray-800 pb-1">
                    <span>PERIOD</span>
                    <span>{prevPeriodRef.current.slice(-4) || '----'}</span>
                </div>

                {isAnalyzing ? (
                   <div className="py-6 bg-gray-900/50 rounded border border-gray-800 mt-2 flex flex-col items-center justify-center">
                      <div className="text-yellow-500 text-xs font-bold animate-pulse mb-1">ANALYZING HASH...</div>
                      <div className="w-3/4 h-1 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-yellow-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                      </div>
                   </div>
                ) : (
                   <div className={`py-2 bg-gray-900 rounded border ${showFlash ? 'border-white bg-opacity-10' : 'border-gray-700'} mt-2 relative overflow-hidden transition-all duration-200`}>
                        {/* Signal visual effect */}
                        <div className="absolute inset-0 bg-green-500/5 pointer-events-none"></div>

                        <div className="text-[10px] text-gray-500 mb-1 tracking-widest uppercase">SIGNAL RESULT</div>
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <span 
                            className="text-4xl font-black hack-font tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ 
                                color: prediction?.result === 'BIG' ? '#fbbf24' : '#60a5fa',
                                textShadow: `0 0 20px ${prediction?.result === 'BIG' ? '#fbbf24' : '#60a5fa'}`
                            }}
                            >
                                {prediction?.result}
                            </span>
                        </div>
                        
                        <div className="flex justify-center items-center gap-2 mt-2">
                            <div className="flex gap-1">
                                {prediction?.colors.map((color, idx) => (
                                    <div 
                                        key={idx} 
                                        className="w-3 h-3 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] border border-white/40"
                                        style={{ backgroundColor: color }}
                                    ></div>
                                ))}
                            </div>
                            <span className="text-white font-bold text-sm">No: {prediction?.number}</span>
                        </div>
                        
                        {/* Confidence Level */}
                        <div className="mt-2 text-[9px] text-gray-400">
                           CONFIDENCE: <span className="text-green-400 font-bold">{prediction?.confidence}%</span>
                        </div>
                   </div>
                )}
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black p-1 text-center border-t border-green-900">
        <div className="text-[8px] text-green-700">VIP SERVER CONNECTED</div>
      </div>
    </div>
  );
};

export default GameOverlay;
