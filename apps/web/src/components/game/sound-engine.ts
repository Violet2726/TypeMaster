/**
 * Sound Engine - Enhanced Web Audio API synthesis.
 *
 * Rich audio feedback with layered tones, noise textures, and harmonic combos.
 * No external audio files - everything is synthesized in real-time.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxEnabled = true;

export function initSound() {
    if (!ctx) {
        ctx = new AudioContext();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.6;
        masterGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
}

export function setSfxEnabled(enabled: boolean) { sfxEnabled = enabled; }

function tone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, delay: number = 0) {
    if (!ctx || !masterGain || !sfxEnabled) return;
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

function noise(duration: number, filterFreq: number, vol: number = 0.1, delay: number = 0) {
    if (!ctx || !masterGain || !sfxEnabled) return;
    const t = ctx.currentTime + delay;
    const bufSize = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = filterFreq;
    filt.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(masterGain);
    src.start(t);
    src.stop(t + duration);
}

// ---------------------------------------------------------------------------
// Game Sounds
// ---------------------------------------------------------------------------

export function playClickSound() {
    tone(600, "sine", 0.04, 0.08);
}

export function playKillSound(enemyType?: string) {
    // Base kill: rising two-tone
    const base = enemyType === "boss" ? 800 : enemyType === "tank" ? 1000 : 1200;
    tone(base, "sine", 0.12, 0.18);
    tone(base * 1.5, "sine", 0.1, 0.12, 0.04);

    // Glass shatter texture
    noise(0.08, 4000, 0.08);

    // Type-specific accent
    if (enemyType === "boss") {
        tone(200, "sine", 0.3, 0.15);
        noise(0.15, 2000, 0.1, 0.05);
    } else if (enemyType === "tank") {
        tone(300, "triangle", 0.15, 0.1);
    } else if (enemyType === "fast") {
        tone(1600, "sine", 0.06, 0.1);
    }
}

export function playErrorSound() {
    tone(200, "sawtooth", 0.1, 0.12);
    tone(150, "sawtooth", 0.08, 0.08, 0.03);
}

export function playComboSound(combo: number) {
    // Rising harmonic stack
    const base = 400 + Math.min(combo, 20) * 25;
    tone(base, "triangle", 0.08, 0.06);
    tone(base * 1.25, "sine", 0.06, 0.04, 0.02);
    if (combo >= 10) {
        tone(base * 1.5, "sine", 0.05, 0.03, 0.04);
    }
}

export function playChainAttackSound() {
    // Chain attack: dramatic ascending sweep
    tone(300, "sawtooth", 0.2, 0.15);
    tone(500, "triangle", 0.15, 0.1, 0.03);
    tone(800, "sine", 0.1, 0.08, 0.06);
    tone(1200, "sine", 0.08, 0.06, 0.09);
    noise(0.1, 4000, 0.08, 0.03);
}

export function playChainSound(chain: number) {
    // Descending arpeggio for chain kills
    const base = 600 + chain * 100;
    tone(base, "sine", 0.08, 0.1);
    tone(base * 1.5, "triangle", 0.06, 0.08, 0.03);
    tone(base * 2, "sine", 0.05, 0.06, 0.06);
}

export function playPowerUpSound() {
    // Magical ascending chime
    tone(523, "sine", 0.15, 0.12);
    tone(659, "sine", 0.12, 0.1, 0.08);
    tone(784, "sine", 0.1, 0.08, 0.16);
    tone(1047, "sine", 0.08, 0.06, 0.24);
}

export function playBossCounterSound() {
    // Warning: rising pitch siren
    tone(300, "sawtooth", 0.15, 0.15);
    tone(500, "sawtooth", 0.12, 0.1, 0.05);
    tone(700, "square", 0.1, 0.08, 0.1);
    noise(0.08, 2000, 0.06);
}

export function playBossWeakPointSound() {
    // Weak point exposed: high chime
    tone(1200, "sine", 0.15, 0.1);
    tone(1500, "sine", 0.1, 0.08, 0.03);
    tone(1800, "triangle", 0.08, 0.06, 0.06);
}

export function playShieldBreakSound() {
    // Glass breaking
    noise(0.15, 6000, 0.12);
    tone(800, "sine", 0.1, 0.1);
    tone(400, "triangle", 0.15, 0.08, 0.05);
}

export function playWaveClearSound() {
    // Fanfare: three ascending chords
    tone(523, "triangle", 0.3, 0.1);
    tone(659, "sine", 0.3, 0.08);
    tone(784, "triangle", 0.3, 0.06, 0.15);
    tone(1047, "sine", 0.4, 0.1, 0.3);
    noise(0.2, 3000, 0.04, 0.3);
}

export function playGameOverSound() {
    // Descending minor chord
    tone(440, "triangle", 0.5, 0.12);
    tone(523, "sine", 0.5, 0.08);
    tone(330, "triangle", 0.6, 0.1, 0.1);
    tone(262, "sine", 0.8, 0.08, 0.2);
}

export function playAchievementSound() {
    // Sparkle chime
    tone(1047, "sine", 0.2, 0.1);
    tone(1319, "sine", 0.15, 0.08, 0.05);
    tone(1568, "sine", 0.12, 0.06, 0.1);
    tone(2093, "sine", 0.1, 0.05, 0.15);
    noise(0.1, 8000, 0.03, 0.1);
}

// ---------------------------------------------------------------------------
// Boss Phase Transition Sounds
// ---------------------------------------------------------------------------

export function playBossPhaseSound(phase: number) {
    // Phase-specific dramatic sounds
    if (phase === 1) {
        // Phase 1: Deep rumble
        tone(80, "sine", 0.3, 0.2);
        tone(120, "triangle", 0.15, 0.15, 0.05);
    } else if (phase === 2) {
        // Phase 2: Rising tension
        tone(200, "sawtooth", 0.2, 0.15);
        tone(300, "sine", 0.15, 0.1, 0.08);
        tone(400, "triangle", 0.1, 0.08, 0.16);
    } else {
        // Phase 3: Chaos
        tone(400, "sawtooth", 0.25, 0.12);
        tone(600, "square", 0.15, 0.1, 0.05);
        tone(800, "sine", 0.1, 0.08, 0.1);
        noise(0.12, 3000, 0.1);
    }
    // Original sound

    if (phase === 1) {
        // Phase 1: Deep rumble
        tone(120, "sine", 0.4, 0.15);
        tone(80, "triangle", 0.5, 0.12, 0.05);
        noise(0.2, 2000, 0.08, 0.08);
    } else if (phase === 2) {
        // Phase 2: Rising tension
        tone(200, "sawtooth", 0.3, 0.12);
        tone(300, "sine", 0.25, 0.1, 0.05);
        tone(400, "triangle", 0.2, 0.08, 0.1);
        noise(0.15, 3000, 0.06, 0.12);
    } else if (phase === 3) {
        // Phase 3: Desperate alarm
        tone(600, "sawtooth", 0.2, 0.08);
        tone(800, "sine", 0.18, 0.06, 0.04);
        tone(1000, "triangle", 0.15, 0.05, 0.08);
        tone(1200, "sine", 0.12, 0.04, 0.12);
        noise(0.2, 5000, 0.1, 0.06);
    }
}

// ---------------------------------------------------------------------------
// Breathing Wave Sound
// ---------------------------------------------------------------------------

export function playBreathingWaveSound() {
    // Soothing, calming recovery wave
    tone(330, "sine", 0.4, 0.15);
    tone(440, "sine", 0.35, 0.12, 0.1);
    tone(550, "sine", 0.3, 0.1, 0.2);
    tone(660, "sine", 0.25, 0.08, 0.3);
}

// ---------------------------------------------------------------------------
// Combo Progression Sounds
// ---------------------------------------------------------------------------

export function playComboMilestoneSound(combo: number) {
    if (combo >= 20) {
        // Epic: full chord + noise burst
        tone(523, "sine", 0.25, 0.1);
        tone(659, "sine", 0.22, 0.08);
        tone(784, "sine", 0.2, 0.06);
        tone(1047, "sine", 0.18, 0.05);
        noise(0.15, 4000, 0.08, 0.08);
    } else if (combo >= 15) {
        // Intense: fast arpeggio
        tone(600, "sine", 0.15, 0.06);
        tone(750, "triangle", 0.12, 0.05, 0.03);
        tone(900, "sine", 0.1, 0.04, 0.06);
    } else if (combo >= 10) {
        // Strong: rising pair
        tone(500, "triangle", 0.12, 0.08);
        tone(700, "sine", 0.1, 0.06, 0.04);
    } else if (combo >= 5) {
        // Building: single bright note
        tone(600, "sine", 0.1, 0.08);
        tone(800, "triangle", 0.08, 0.06, 0.02);
    }
}

// ---------------------------------------------------------------------------
// Environment Theme Sounds
// ---------------------------------------------------------------------------

export function playThemeTransitionSound(theme: string) {
    if (theme === 'nebula') {
        // Ethereal transition: soft pad
        tone(220, "sine", 0.6, 0.2);
        tone(330, "sine", 0.5, 0.15, 0.1);
        tone(440, "sine", 0.4, 0.12, 0.2);
    } else if (theme === 'black-hole') {
        // Dark transition: deep rumble + dissonance
        tone(80, "sawtooth", 0.5, 0.2);
        tone(120, "sine", 0.4, 0.15, 0.05);
        tone(160, "triangle", 0.35, 0.12, 0.1);
        noise(0.3, 1500, 0.1, 0.15);
    }
}

// ---------------------------------------------------------------------------
// Menu Navigation Sounds
// ---------------------------------------------------------------------------

export function playMenuNavigate() {
    // Soft click for menu navigation
    tone(800, "sine", 0.03, 0.05);
}

export function playMenuSelect() {
    // Confirmation sound
    tone(600, "sine", 0.06, 0.08);
    tone(900, "sine", 0.04, 0.06, 0.02);
}

export function playMenuBack() {
    // Back/cancel sound
    tone(400, "sine", 0.05, 0.06);
}

export function playMenuToggle() {
    // Toggle switch sound
    tone(1000, "sine", 0.03, 0.06);
    tone(1200, "sine", 0.02, 0.04, 0.02);
}

export function playCountdownBeep() {
    // Countdown beep
    tone(440, "sine", 0.1, 0.1);
}

export function playCountdownGo() {
    // Countdown go
    tone(880, "sine", 0.15, 0.12);
}
