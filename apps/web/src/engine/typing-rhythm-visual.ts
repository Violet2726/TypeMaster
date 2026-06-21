/**
 * Typing Rhythm Visual
 *
 * Apple philosophy: the UI should breathe with the player's rhythm.
 * When you type fast and accurately, the game world responds in kind.
 *
 * Three visual layers:
 * 1. Rhythm Bar - bottom of screen, pulses with typing cadence
 * 2. Flow State - consecutive correct inputs build a golden aura
 * 3. Speed Ring - radial indicator around active enemy showing WPM
 *
 * All effects are subtle by design - they reward skilled play
 * without being distracting during normal gameplay.
 */

import { COLORS } from '../components/game/colors';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface RhythmState {
    // Rhythm bar
    barPulse: number;          // 0-1, current pulse intensity
    barDecay: number;          // decay rate
    lastTypeTime: number;
    bpm: number;               // estimated beats per minute

    // Flow state
    consecutiveCorrect: number;
    flowLevel: number;         // 0-3 (0=off, 1=glow, 2=aura, 3=full golden)
    flowDecay: number;         // 0-1, how close to losing flow
    flowPeakTime: number;

    // Speed ring
    currentWpm: number;
    wpmHistory: number[];      // last 20 keystroke timestamps
    keystrokeTimes: number[];
}

let state: RhythmState = {
    barPulse: 0, barDecay: 0.92, lastTypeTime: 0, bpm: 0,
    consecutiveCorrect: 0, flowLevel: 0, flowDecay: 1, flowPeakTime: 0,
    currentWpm: 0, wpmHistory: [], keystrokeTimes: [],
};

export function resetRhythm(): void {
    state = {
        barPulse: 0, barDecay: 0.92, lastTypeTime: 0, bpm: 0,
        consecutiveCorrect: 0, flowLevel: 0, flowDecay: 1, flowPeakTime: 0,
        currentWpm: 0, wpmHistory: [], keystrokeTimes: [],
    };
}

// ---------------------------------------------------------------------------
// Input tracking
// ---------------------------------------------------------------------------

export function onCorrectKeystroke(): void {
    const now = performance.now();
    const gap = now - state.lastTypeTime;

    // Track keystroke timing
    state.keystrokeTimes.push(now);
    if (state.keystrokeTimes.length > 30) state.keystrokeTimes.shift();

    // Calculate BPM from recent gaps
    if (gap > 0 && gap < 2000) {
        const instantBpm = 60000 / gap;
        state.bpm = state.bpm * 0.7 + instantBpm * 0.3; // smooth
    }

    state.lastTypeTime = now;
    state.barPulse = Math.min(1, state.barPulse + 0.3);

    // Consecutive correct
    state.consecutiveCorrect++;
    state.flowDecay = 1;

    // Update flow level
    if (state.consecutiveCorrect >= 25) state.flowLevel = 3;
    else if (state.consecutiveCorrect >= 15) state.flowLevel = 2;
    else if (state.consecutiveCorrect >= 8) state.flowLevel = 1;
    else state.flowLevel = 0;

    if (state.flowLevel >= 3) state.flowPeakTime = now;

    // Calculate WPM from last 20 keystrokes
    if (state.keystrokeTimes.length >= 2) {
        const recent = state.keystrokeTimes.slice(-20);
        const elapsed = (recent[recent.length - 1] - recent[0]) / 1000; // seconds
        if (elapsed > 0) {
            state.currentWpm = Math.round((recent.length - 1) / 5 / (elapsed / 60));
        }
    }
}

export function onIncorrectKeystroke(): void {
    state.consecutiveCorrect = 0;
    state.flowLevel = 0;
    state.flowDecay = 0.5;
    state.barPulse = Math.max(0, state.barPulse - 0.15);
}

// ---------------------------------------------------------------------------
// Update (call every frame)
// ---------------------------------------------------------------------------

export function updateRhythm(dt: number): void {
    // Bar pulse decay
    state.barPulse *= Math.pow(state.barDecay, dt * 60);
    if (state.barPulse < 0.01) state.barPulse = 0;

    // BPM decay (if no typing for a while)
    if (performance.now() - state.lastTypeTime > 2000) {
        state.bpm *= 0.95;
    }

    // Flow decay
    if (state.flowLevel > 0 && state.consecutiveCorrect === 0) {
        state.flowDecay -= dt * 0.8;
        if (state.flowDecay <= 0) {
            state.flowLevel = 0;
            state.flowDecay = 1;
        }
    }

    // WPM history for display
    if (state.currentWpm > 0) {
        state.wpmHistory.push(state.currentWpm);
        if (state.wpmHistory.length > 60) state.wpmHistory.shift();
    }
}

// ---------------------------------------------------------------------------
// Render: Rhythm Bar
// ---------------------------------------------------------------------------

export function renderRhythmBar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
): void {
    // Only show when typing has happened
    if (state.bpm < 5 && state.barPulse < 0.01) return;

    const barH = 3;
    const barY = h - 8;
    const barW = w * 0.4;
    const barX = (w - barW) / 2;

    // Background track
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 1.5);
    ctx.fill();

    // Pulse fill (width based on BPM, color based on intensity)
    const bpmNorm = Math.min(1, state.bpm / 200); // 200 BPM = max
    const fillW = barW * Math.max(0.05, bpmNorm);

    // Color: blue -> green -> gold based on BPM
    let barColor: string;
    if (state.bpm >= 120) barColor = '#ffd700';
    else if (state.bpm >= 80) barColor = '#32d74b';
    else barColor = '#0a84ff';

    ctx.fillStyle = barColor;
    ctx.globalAlpha = 0.6 + state.barPulse * 0.4;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 1.5);
    ctx.fill();

    // Pulse highlight
    if (state.barPulse > 0.1) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = state.barPulse * 0.5;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, 1.5);
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    // BPM indicator (subtle, above bar)
    if (state.bpm >= 30) {
        ctx.font = '400 8px -apple-system, SF Pro Text, system-ui, sans-serif';
        ctx.fillStyle = barColor;
        ctx.globalAlpha = 0.5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(Math.round(state.bpm) + ' BPM', w / 2, barY - 3);
        ctx.globalAlpha = 1;
    }
}

// ---------------------------------------------------------------------------
// Render: Flow State Aura
// ---------------------------------------------------------------------------

export function renderFlowAura(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
): void {
    if (state.flowLevel === 0) return;

    const alpha = state.flowDecay;

    ctx.save();

    if (state.flowLevel >= 1) {
        // Level 1: Subtle edge glow (bottom corners)
        const glowAlpha = alpha * 0.15;
        const grad = ctx.createRadialGradient(w * 0.2, h, 0, w * 0.2, h, h * 0.4);
        grad.addColorStop(0, `rgba(255,215,0,${glowAlpha})`);
        grad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, h * 0.5, w * 0.5, h * 0.5);

        const grad2 = ctx.createRadialGradient(w * 0.8, h, 0, w * 0.8, h, h * 0.4);
        grad2.addColorStop(0, `rgba(255,215,0,${glowAlpha})`);
        grad2.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(w * 0.5, h * 0.5, w * 0.5, h * 0.5);
    }

    if (state.flowLevel >= 2) {
        // Level 2: Full edge glow + breathing
        const breathe = Math.sin(time * 0.004) * 0.03 + 0.07;
        const glowAlpha = alpha * breathe;

        // Top edge
        const topGrad = ctx.createLinearGradient(0, 0, 0, 60);
        topGrad.addColorStop(0, `rgba(255,215,0,${glowAlpha})`);
        topGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, 60);

        // Side edges
        const leftGrad = ctx.createLinearGradient(0, 0, 40, 0);
        leftGrad.addColorStop(0, `rgba(255,215,0,${glowAlpha})`);
        leftGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, 40, h);

        const rightGrad = ctx.createLinearGradient(w, 0, w - 40, 0);
        rightGrad.addColorStop(0, `rgba(255,215,0,${glowAlpha})`);
        rightGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(w - 40, 0, 40, h);
    }

    if (state.flowLevel >= 3) {
        // Level 3: Full golden aura + pulsing vignette
        const pulse = Math.sin(time * 0.005) * 0.02 + 0.04;
        const auraAlpha = alpha * pulse;

        // Full-screen golden tint
        ctx.fillStyle = `rgba(255,215,0,${auraAlpha * 0.3})`;
        ctx.fillRect(0, 0, w, h);

        // Vignette ring
        const vigGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.8);
        vigGrad.addColorStop(0, 'rgba(255,215,0,0)');
        vigGrad.addColorStop(0.7, 'rgba(255,215,0,0)');
        vigGrad.addColorStop(1, `rgba(255,215,0,${auraAlpha})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, w, h);

        // FLOW text indicator
        const textAlpha = alpha * (Math.sin(time * 0.006) * 0.15 + 0.6);
        ctx.font = '700 10px -apple-system, SF Pro Display, system-ui, sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.globalAlpha = textAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = '4px';
        ctx.fillText('FLOW', w / 2, 12);
        ctx.letterSpacing = '0px';
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Render: Speed Ring (around active enemy)
// ---------------------------------------------------------------------------

export function renderSpeedRing(
    ctx: CanvasRenderingContext2D,
    enemyX: number,
    enemyY: number,
    enemySize: number,
    time: number,
): void {
    if (state.currentWpm < 20) return;

    const wpmNorm = Math.min(1, (state.currentWpm - 20) / 80); // 20-100 WPM range
    const ringRadius = enemySize + 10 + wpmNorm * 8;
    const alpha = 0.15 + wpmNorm * 0.25;

    // Spinning ring segments
    const rotation = time * 0.002 * (1 + wpmNorm);
    const segments = 3;

    ctx.save();
    ctx.translate(enemyX, enemyY);

    for (let i = 0; i < segments; i++) {
        const angle = rotation + (Math.PI * 2 / segments) * i;
        const arcLen = Math.PI * 0.4 * (0.5 + wpmNorm * 0.5);

        ctx.strokeStyle = state.currentWpm >= 80 ? '#ffd700' : state.currentWpm >= 50 ? '#32d74b' : '#0a84ff';
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, angle, angle + arcLen);
        ctx.stroke();
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function getFlowLevel(): number { return state.flowLevel; }
export function getCurrentWpm(): number { return state.currentWpm; }
export function getBpm(): number { return state.bpm; }
