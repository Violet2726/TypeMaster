/**
 * Procedural Music Engine
 *
 * Real-time synthesized background music using Web Audio API.
 * No external audio files - everything is generated from oscillators and noise.
 *
 * Three musical themes match the environment progression:
 *   Deep Space:  Low drones, sparse arps, minor key, 80 BPM
 *   Nebula:      Ethereal pads, suspended chords, 100 BPM
 *   Black Hole:  Intense bass, diminished chords, 120 BPM
 *
 * Music responds to game state:
 *   - Idle: minimal, just drone + soft pad
 *   - Playing: full layers (bass + pad + arp + percussion)
 *   - High combo: increased filter cutoff + resonance
 *   - Paused: fade to drone only
 */

type ThemeName = "deep-space" | "nebula" | "black-hole";

interface MusicTheme {
    bpm: number;
    baseNote: number;       // MIDI note for root
    scale: number[];        // semitone intervals from root
    bassFreq: number;
    padChord: number[];     // semitone offsets for pad chord
    arpNotes: number[];     // semitone offsets for arpeggio
    filterCutoff: number;
    resonance: number;
    padVolume: number;
    bassVolume: number;
    arpVolume: number;
    percVolume: number;
}

const THEMES: Record<ThemeName, MusicTheme> = {
    "deep-space": {
        bpm: 80, baseNote: 33, // A1
        scale: [0, 3, 5, 7, 10], // A minor pentatonic
        bassFreq: 55,
        padChord: [0, 3, 7], // Am
        arpNotes: [0, 3, 7, 12, 7, 3],
        filterCutoff: 400, resonance: 1,
        padVolume: 0.08, bassVolume: 0.12, arpVolume: 0.04, percVolume: 0.02,
    },
    "nebula": {
        bpm: 100, baseNote: 36, // C2
        scale: [0, 2, 4, 7, 9], // C major pentatonic
        bassFreq: 65.41,
        padChord: [0, 4, 7, 11], // Cmaj7
        arpNotes: [0, 4, 7, 11, 12, 11, 7, 4],
        filterCutoff: 800, resonance: 2,
        padVolume: 0.1, bassVolume: 0.08, arpVolume: 0.06, percVolume: 0.03,
    },
    "black-hole": {
        bpm: 120, baseNote: 31, // G1
        scale: [0, 3, 6, 9], // diminished
        bassFreq: 49,
        padChord: [0, 3, 6, 9], // diminished
        arpNotes: [0, 3, 6, 9, 12, 9, 6, 3],
        filterCutoff: 1200, resonance: 3,
        padVolume: 0.12, bassVolume: 0.15, arpVolume: 0.08, percVolume: 0.05,
    },
};

function midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}

// ---------------------------------------------------------------------------
// Music Engine
// ---------------------------------------------------------------------------

export interface MusicEngine {
    start(): void;
    stop(): void;
    setTheme(name: ThemeName): void;
    setPlaying(playing: boolean): void;
    setCombo(combo: number): void;
    setPaused(paused: boolean): void;
    setVolume(vol: number): void;
    isPlaying(): boolean;
}

export function createMusicEngine(): MusicEngine {
    let ctx: AudioContext | null = null;
    let masterGain: GainNode | null = null;
    let currentTheme: ThemeName = "deep-space";
    let isGamePlaying = false;
    let isPaused = false;
    let comboLevel = 0;
    let volume = 0.5;
    let started = false;

    // Oscillator nodes
    let bassOsc: OscillatorNode | null = null;
    let bassGain: GainNode | null = null;
    let bassFilter: BiquadFilterNode | null = null;

    let padOscs: OscillatorNode[] = [];
    let padGain: GainNode | null = null;
    let padFilter: BiquadFilterNode | null = null;

    let arpOsc: OscillatorNode | null = null;
    let arpGain: GainNode | null = null;
    let arpFilter: BiquadFilterNode | null = null;

    // LFO for filter modulation
    let filterLfo: OscillatorNode | null = null;
    let filterLfoGain: GainNode | null = null;

    // Arp sequencer state
    let arpIndex = 0;
    let arpTimer: number | null = null;
    let percTimer: number | null = null;

    function midi(note: number): number { return midiToFreq(note); }

    function createNodes() {
        if (!ctx) return;

        masterGain = ctx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(ctx.destination);

        // --- Bass ---
        bassOsc = ctx.createOscillator();
        bassOsc.type = "sine";
        bassOsc.frequency.value = THEMES[currentTheme].bassFreq;

        bassFilter = ctx.createBiquadFilter();
        bassFilter.type = "lowpass";
        bassFilter.frequency.value = 200;
        bassFilter.Q.value = 1;

        bassGain = ctx.createGain();
        bassGain.gain.value = isGamePlaying ? THEMES[currentTheme].bassVolume : 0.02;

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(masterGain);
        bassOsc.start();

        // --- Pad (3 oscillators for chord) ---
        const theme = THEMES[currentTheme];
        padFilter = ctx.createBiquadFilter();
        padFilter.type = "lowpass";
        padFilter.frequency.value = theme.filterCutoff;
        padFilter.Q.value = theme.resonance;

        padGain = ctx.createGain();
        padGain.gain.value = isGamePlaying ? theme.padVolume : theme.padVolume * 0.5;

        padOscs = theme.padChord.map(offset => {
            const osc = ctx!.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = midi(theme.baseNote + 12 + offset);
            osc.connect(padFilter!);
            osc.start();
            return osc;
        });

        padFilter.connect(padGain);
        padGain.connect(masterGain);

        // --- Arp ---
        arpOsc = ctx.createOscillator();
        arpOsc.type = "square";
        arpOsc.frequency.value = midi(theme.baseNote + 24 + theme.arpNotes[0]);

        arpFilter = ctx.createBiquadFilter();
        arpFilter.type = "lowpass";
        arpFilter.frequency.value = theme.filterCutoff * 1.5;
        arpFilter.Q.value = 2;

        arpGain = ctx.createGain();
        arpGain.gain.value = isGamePlaying ? theme.arpVolume : 0;

        arpOsc.connect(arpFilter);
        arpFilter.connect(arpGain);
        arpGain.connect(masterGain);
        arpOsc.start();

        // --- Filter LFO ---
        filterLfo = ctx.createOscillator();
        filterLfo.type = "sine";
        filterLfo.frequency.value = 0.1; // very slow

        filterLfoGain = ctx.createGain();
        filterLfoGain.gain.value = theme.filterCutoff * 0.3;

        filterLfo.connect(filterLfoGain);
        filterLfoGain.connect(padFilter.frequency);
        filterLfoGain.connect(arpFilter.frequency);
        filterLfo.start();
    }

    function startArpSequencer() {
        if (arpTimer) clearInterval(arpTimer);
        const theme = THEMES[currentTheme];
        const interval = 60000 / theme.bpm / 2; // eighth notes

        arpTimer = window.setInterval(() => {
            if (!isGamePlaying || isPaused || !arpOsc || !ctx) return;

            const note = theme.arpNotes[arpIndex % theme.arpNotes.length];
            const freq = midi(theme.baseNote + 24 + note);
            arpOsc.frequency.setValueAtTime(freq, ctx.currentTime);

            // Staccato envelope
            if (arpGain) {
                arpGain.gain.setValueAtTime(theme.arpVolume * 1.5, ctx.currentTime);
                arpGain.gain.exponentialRampToValueAtTime(theme.arpVolume * 0.3, ctx.currentTime + interval / 1000 * 0.8);
            }

            arpIndex++;
        }, interval);
    }

    function startPercussion() {
        if (percTimer) clearInterval(percTimer);
        const theme = THEMES[currentTheme];
        const interval = 60000 / theme.bpm; // quarter notes

        percTimer = window.setInterval(() => {
            if (!isGamePlaying || isPaused || !ctx || !masterGain) return;

            // Noise burst for hi-hat
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = "highpass";
            noiseFilter.frequency.value = 8000;

            const noiseGain = ctx.createGain();
            noiseGain.gain.value = theme.percVolume;

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noise.start();
        }, interval);
    }

    function applyTheme(themeName: ThemeName) {
        const theme = THEMES[themeName];
        if (!ctx) return;

        const t = ctx.currentTime;

        if (bassOsc) bassOsc.frequency.linearRampToValueAtTime(theme.bassFreq, t + 2);
        if (bassGain) bassGain.gain.linearRampToValueAtTime(isGamePlaying ? theme.bassVolume : 0.02, t + 1);
        if (bassFilter) bassFilter.frequency.linearRampToValueAtTime(200, t + 1);

        if (padFilter) {
            padFilter.frequency.linearRampToValueAtTime(theme.filterCutoff, t + 2);
            padFilter.Q.linearRampToValueAtTime(theme.resonance, t + 1);
        }
        if (padGain) padGain.gain.linearRampToValueAtTime(isGamePlaying ? theme.padVolume : theme.padVolume * 0.5, t + 1);

        // Rebuild pad chord
        padOscs.forEach((osc, i) => {
            const offset = theme.padChord[i % theme.padChord.length];
            osc.frequency.linearRampToValueAtTime(midi(theme.baseNote + 12 + offset), t + 2);
        });

        if (arpGain) arpGain.gain.linearRampToValueAtTime(isGamePlaying ? theme.arpVolume : 0, t + 1);

        // Restart sequencers with new tempo
        startArpSequencer();
        startPercussion();
    }

    return {
        start() {
            if (started) return;
            ctx = new AudioContext();
            if (ctx.state === "suspended") ctx.resume();
            createNodes();
            startArpSequencer();
            startPercussion();
            started = true;
        },

        stop() {
            if (!started) return;
            if (arpTimer) { clearInterval(arpTimer); arpTimer = null; }
            if (percTimer) { clearInterval(percTimer); percTimer = null; }
            if (bassOsc) { bassOsc.stop(); bassOsc = null; }
            padOscs.forEach(o => o.stop());
            padOscs = [];
            if (arpOsc) { arpOsc.stop(); arpOsc = null; }
            if (filterLfo) { filterLfo.stop(); filterLfo = null; }
            if (ctx) { ctx.close(); ctx = null; }
            started = false;
        },

        setTheme(name: ThemeName) {
            if (name === currentTheme) return;
            currentTheme = name;
            if (started) applyTheme(name);
        },

        setPlaying(playing: boolean) {
            isGamePlaying = playing;
            if (!started || !ctx) return;
            const t = ctx.currentTime;
            const theme = THEMES[currentTheme];
            if (bassGain) bassGain.gain.linearRampToValueAtTime(playing ? theme.bassVolume : 0.02, t + 0.5);
            if (padGain) padGain.gain.linearRampToValueAtTime(playing ? theme.padVolume : theme.padVolume * 0.5, t + 0.5);
            if (arpGain) arpGain.gain.linearRampToValueAtTime(playing ? theme.arpVolume : 0, t + 0.3);
        },

        setCombo(combo: number) {
            comboLevel = combo;
            if (!started || !ctx) return;
            const theme = THEMES[currentTheme];
            const t = ctx.currentTime;
            // Higher combo = brighter filter + more resonance
            const comboBoost = Math.min(combo, 20) * 30;
            if (padFilter) padFilter.frequency.linearRampToValueAtTime(theme.filterCutoff + comboBoost, t + 0.3);
            if (arpFilter) arpFilter.frequency.linearRampToValueAtTime(theme.filterCutoff * 1.5 + comboBoost, t + 0.3);
        },

        setPaused(paused: boolean) {
            isPaused = paused;
            if (!started || !ctx) return;
            const t = ctx.currentTime;
            if (bassGain) bassGain.gain.linearRampToValueAtTime(paused ? 0.01 : THEMES[currentTheme].bassVolume, t + 0.5);
            if (padGain) padGain.gain.linearRampToValueAtTime(paused ? 0.02 : THEMES[currentTheme].padVolume, t + 0.5);
            if (arpGain) arpGain.gain.linearRampToValueAtTime(0, t + 0.3);
        },

        setVolume(vol: number) {
            volume = Math.max(0, Math.min(1, vol));
            if (masterGain && ctx) masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
        },

        isPlaying() { return started; },
    };
}