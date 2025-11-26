
/**
 * Simple Audio Service using Web Audio API
 * No external files required to keep the app lightweight and self-contained.
 */

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1, startTime: number = 0) => {
  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playClickSound = () => {
  playTone(1200, 'sine', 0.1, 0.05);
};

export const playTypeSound = () => {
  playTone(800, 'square', 0.05, 0.02);
};

export const playSuccessSound = () => {
  // High pitch ascending
  if (!audioCtx) initAudio();
  playTone(600, 'sine', 0.1, 0.1, 0);
  playTone(1200, 'sine', 0.2, 0.1, 0.1);
};

export const playErrorSound = () => {
  playTone(150, 'sawtooth', 0.3, 0.2);
};

export const playSignalSound = () => {
  // Distinct "Cyber Hack" Signal Sound
  // A heavy impact followed by a high tech ping
  if (!audioCtx) initAudio();
  
  // Low frequency impact (Bass)
  playTone(100, 'sawtooth', 0.4, 0.3, 0);
  playTone(80, 'square', 0.4, 0.3, 0.05);

  // High frequency detailed ping (The "Result" sound)
  playTone(2000, 'sine', 0.1, 0.1, 0.2);
  playTone(1500, 'sine', 0.3, 0.1, 0.25);
  playTone(2500, 'square', 0.1, 0.05, 0.3);
};
