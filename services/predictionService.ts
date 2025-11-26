
import { PredictionResult } from '../types';

/**
 * LOGIC UPDATED: Smart Hash Algorithm
 * Designed to produce more "distributed" results simulating a real game trend.
 */

export const getPeriodId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  const totalMinutes = hours * 60 + minutes;
  const seconds = now.getSeconds();
  // 30 second cycles means 2 periods per minute
  // Cycle 1: 00-29s, Cycle 2: 30-59s
  const cycle = seconds >= 30 ? 2 : 1;
  const periodSequence = (totalMinutes * 2) + cycle;

  return `${year}${month}${day}${String(periodSequence).padStart(4, '0')}`;
};

// MurmurHash3-like function for better distribution than simple sine
const smartHash = (str: string) => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    // Mix
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 0xc2b2ae35);
    hash ^= hash >>> 16;
    
    return (hash >>> 0) / 4294967296; // Normalize to 0-1
};

export const generatePrediction = (currentPeriod: string): PredictionResult => {
  // Use Smart Hash
  const seed = smartHash(currentPeriod + "BOSS_VIP_SECRET_SALT"); 
  
  // Map float to 0-9
  const randomNumber = Math.floor(seed * 10);
  
  let colors: string[] = [];
  let colorName = '';
  // WinGo Rules
  let result: 'BIG' | 'SMALL' = randomNumber >= 5 ? 'BIG' : 'SMALL';

  if (randomNumber === 0) {
    colors = ['#ff0000', '#9c27b0']; // Red + Violet
    colorName = 'Red + Violet';
  } else if (randomNumber === 5) {
    colors = ['#00ff00', '#9c27b0']; // Green + Violet
    colorName = 'Green + Violet';
  } else if ([1, 3, 7, 9].includes(randomNumber)) {
    colors = ['#00ff00']; // Green
    colorName = 'Green';
  } else {
    colors = ['#ff0000']; // Red
    colorName = 'Red';
  }

  // Calculate simulated "Confidence"
  // If the seed is very close to the middle (0.5), confidence is lower.
  // If it's towards edges (0.1, 0.9), confidence is higher.
  // This is just visual candy.
  const distFromMiddle = Math.abs(seed - 0.5);
  const confidence = Math.floor(85 + (distFromMiddle * 28)); // Range roughly 85% - 99%

  return {
    period: currentPeriod,
    number: randomNumber,
    result,
    colors,
    colorName,
    confidence
  };
};

export const fetchPredictionData = async (): Promise<{ countdown: number; prediction: PredictionResult | null }> => {
  const now = new Date();
  const seconds = now.getSeconds();
  
  // Logic: 30 second countdown.
  const mod30 = seconds % 30;
  let countdown = 30 - mod30;
  
  const currentPeriod = getPeriodId();
  
  // Generate prediction
  const prediction = generatePrediction(currentPeriod);

  return {
    countdown,
    prediction
  };
};
