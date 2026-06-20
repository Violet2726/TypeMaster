let audioContext: AudioContext | null = null;

export function initSound() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gain.gain.setValueAtTime(vol, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + duration);
}

export function playClickSound() {
    playTone(600, 'sine', 0.05, 0.1);
}

export function playKillSound() {
    playTone(1200, 'sine', 0.1, 0.2);
    setTimeout(() => playTone(1800, 'sine', 0.1, 0.15), 50);
    
    // Glass shatter effect
    if (!audioContext) return;
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4000;
    filter.Q.value = 0.5;
    
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    noise.start();
    noise.stop(audioContext.currentTime + 0.1);
}

export function playErrorSound() {
    playTone(200, 'sawtooth', 0.1, 0.15);
}

export function playComboSound(combo: number) {
    const baseFreq = 400 + (combo * 20);
    playTone(baseFreq, 'triangle', 0.1, 0.1);
}
