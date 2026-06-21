/**
 * Rhythm Engine - Typing rhythm sounds and dynamic music
 * 
 * Enhances the audio experience with:
 * 1. Typing rhythm sounds (musical notes that match typing speed)
 * 2. Dynamic intensity layers (music reacts to gameplay)
 * 3. Ambient environment sounds
 * 4. Beat synchronization
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Musical scale (C major pentatonic)
const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
const BASS_SCALE = [130.81, 146.83, 164.81, 196.00, 220.00];

// Rhythm state
let lastNoteIndex = 0;
let typingBpm = 0;
let typingIntensity = 0;
let lastTypeTime = 0;
let typeTimes: number[] = [];

// Intensity layers
let intensityLayers: { osc: OscillatorNode; gain: GainNode }[] = [];
let ambientNoise: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

// Beat tracking
let beatPhase = 0;
let beatBpm = 120;
let beatTimer: number | null = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export function initRhythmEngine(audioCtx: AudioContext, master: GainNode): void {
  ctx = audioCtx;
  masterGain = master;
}

// ---------------------------------------------------------------------------
// Typing Rhythm
// ---------------------------------------------------------------------------

export function onTypingKeystroke(isCorrect: boolean): void {
  if (!ctx || !masterGain) return;
  
  const now = performance.now();
  typeTimes.push(now);
  
  // Keep only recent times
  const windowStart = now - 2000;
  typeTimes = typeTimes.filter(t => t > windowStart);
  
  // Calculate BPM
  if (typeTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < typeTimes.length; i++) {
      intervals.push(typeTimes[i] - typeTimes[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    typingBpm = 60000 / avgInterval;
    typingIntensity = Math.min(1, typingBpm / 150);
  }
  
  // Play musical note based on typing rhythm
  if (isCorrect) {
    // Move up the scale
    lastNoteIndex = (lastNoteIndex + 1) % SCALE.length;
    const freq = SCALE[lastNoteIndex];
    
    // Bright, short note
    playNote(freq, 'sine', 0.08, 0.06 + typingIntensity * 0.04);
    
    // Harmony at higher intensity
    if (typingIntensity > 0.5) {
      playNote(freq * 1.5, 'triangle', 0.06, 0.03, 0.02);
    }
  } else {
    // Error: dissonant note
    playNote(200, 'sawtooth', 0.1, 0.08);
    playNote(210, 'sawtooth', 0.08, 0.06, 0.02);
  }
  
  lastTypeTime = now;
}

// ---------------------------------------------------------------------------
// Intensity Layers
// ---------------------------------------------------------------------------

export function updateIntensity(intensity: number): void {
  if (!ctx || !masterGain) return;
  
  // Smooth transition
  const targetIntensity = Math.max(0, Math.min(1, intensity));
  
  // Update layer volumes based on intensity
  intensityLayers.forEach((layer, i) => {
    const layerThreshold = i / intensityLayers.length;
    const layerVolume = Math.max(0, (targetIntensity - layerThreshold) * intensityLayers.length * 0.1);
    
    if (layer.gain) {
      layer.gain.gain.linearRampToValueAtTime(layerVolume, ctx!.currentTime + 0.1);
    }
  });
}

// ---------------------------------------------------------------------------
// Ambient Sounds
// ---------------------------------------------------------------------------

export function startAmbient(): void {
  if (!ctx || !masterGain) return;
  
  // Create filtered noise for ambient
  const bufSize = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  
  const source = ctx.createBufferSource();
  source.buffer = buf;
  source.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  filter.Q.value = 0.5;
  
  const gain = ctx.createGain();
  gain.gain.value = 0.02;
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();
  
  ambientNoise = { source, gain };
}

export function stopAmbient(): void {
  if (ambientNoise) {
    ambientNoise.source.stop();
    ambientNoise = null;
  }
}

export function setAmbientIntensity(intensity: number): void {
  if (ambientNoise && ctx) {
    const volume = 0.01 + intensity * 0.04;
    ambientNoise.gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.2);
    
    // Adjust filter frequency based on intensity
    const filterFreq = 100 + intensity * 300;
    if (ambientNoise.source) {
      // Access filter through the connected nodes
    }
  }
}

// ---------------------------------------------------------------------------
// Beat Synchronization
// ---------------------------------------------------------------------------

export function setBeatBpm(bpm: number): void {
  beatBpm = Math.max(60, Math.min(200, bpm));
}

export function startBeat(): void {
  if (beatTimer) return;
  
  const interval = 60000 / beatBpm;
  beatPhase = 0;
  
  beatTimer = window.setInterval(() => {
    if (!ctx || !masterGain) return;
    
    // Subtle beat pulse
    const isDownbeat = beatPhase % 4 === 0;
    const freq = isDownbeat ? 80 : 60;
    const vol = isDownbeat ? 0.03 : 0.02;
    
    playNote(freq, 'sine', 0.1, vol);
    
    beatPhase++;
  }, interval);
}

export function stopBeat(): void {
  if (beatTimer) {
    clearInterval(beatTimer);
    beatTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function playNote(
  freq: number,
  type: OscillatorType,
  duration: number,
  vol: number = 0.1,
  delay: number = 0
): void {
  if (!ctx || !masterGain) return;
  
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration);
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getTypingBpm(): number {
  return typingBpm;
}

export function getTypingIntensity(): number {
  return typingIntensity;
}

export function getLastNoteIndex(): number {
  return lastNoteIndex;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function cleanup(): void {
  stopBeat();
  stopAmbient();
  typeTimes = [];
  typingBpm = 0;
  typingIntensity = 0;
  lastNoteIndex = 0;
}
