/**
 * Keystroke Sound - Musical typing feedback.
 *
 * Apple philosophy: sound should enhance without overwhelming.
 * Each key press produces a subtle tone based on its position
 * on a musical scale, creating a melodic typing experience.
 *
 * Features:
 * 1. Pentatonic scale mapping - keys map to C major pentatonic
 * 2. Volume dynamics - faster typing = louder tones
 * 3. Error dissonance - wrong keys produce minor second interval
 * 4. Sound visualizer - optional bottom bar showing recent tones
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxEnabled = true;

// Pentatonic scale frequencies (C4-G4 range)
const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A

// Key to note mapping (qwerty rows -> pentatonic)
const KEY_MAP: Record<string, number> = {};
const ROW1 = 'qwertyuiop';
const ROW2 = 'asdfghjkl';
const ROW3 = 'zxcvbnm';

ROW1.split('').forEach((k, i) => { KEY_MAP[k] = i % 5; });
ROW2.split('').forEach((k, i) => { KEY_MAP[k] = (i + 1) % 5; });
ROW3.split('').forEach((k, i) => { KEY_MAP[k] = (i + 2) % 5; });

// Recent tones for visualizer
interface ToneEvent {
    note: number;
    time: number;
    isCorrect: boolean;
}

const recentTones: ToneEvent[] = [];

export function initKeystrokeSound(): void {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function setKeystrokeSfxEnabled(enabled: boolean): void {
    sfxEnabled = enabled;
}

export function playKeystrokeNote(key: string, isCorrect: boolean): void {
    if (!audioCtx || !masterGain || !sfxEnabled) return;

    const noteIndex = KEY_MAP[key.toLowerCase()];
    if (noteIndex === undefined) return;

    const freq = PENTATONIC[noteIndex];
    const now = audioCtx.currentTime;

    if (isCorrect) {
        // Clean sine tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.15);

        recentTones.push({ note: noteIndex, time: performance.now(), isCorrect: true });
    } else {
        // Dissonant minor second
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.type = 'triangle';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * 1.059, now); // minor second
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.12);
        osc2.stop(now + 0.12);

        recentTones.push({ note: noteIndex, time: performance.now(), isCorrect: false });
    }

    // Keep bounded
    if (recentTones.length > 20) recentTones.shift();
}

export function getRecentTones(): ToneEvent[] {
    // Clean old tones (> 2 seconds)
    const now = performance.now();
    while (recentTones.length > 0 && now - recentTones[0].time > 2000) {
        recentTones.shift();
    }
    return recentTones;
}

// ---------------------------------------------------------------------------
// Sound Visualizer
// ---------------------------------------------------------------------------

import { COLORS } from '../components/game/colors';

export function renderSoundVisualizer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
): void {
    const tones = getRecentTones();
    if (tones.length === 0) return;

    const barW = 3;
    const barGap = 2;
    const maxBars = 20;
    const startX = w / 2 - (maxBars * (barW + barGap)) / 2;
    const barY = h - 30;
    const maxH = 20;

    ctx.save();

    // Background track
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(startX - 4, barY - maxH - 4, maxBars * (barW + barGap) + 8, maxH + 8, 4);
    ctx.fill();

    // Draw bars for recent tones
    tones.forEach((tone, i) => {
        const age = (time - tone.time) / 2000; // 0-1 over 2 seconds
        if (age >= 1) return;

        const alpha = (1 - age) * 0.8;
        const barH = maxH * (0.3 + tone.note / 5 * 0.7) * (1 - age * 0.5);
        const x = startX + i * (barW + barGap);

        ctx.fillStyle = tone.isCorrect ? '#32d74b' : '#ff453a';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.roundRect(x, barY - barH, barW, barH, 1.5);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.restore();
}
