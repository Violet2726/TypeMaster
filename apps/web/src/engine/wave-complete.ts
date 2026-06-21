/**
 * Wave Complete Celebration - Cinematic wave clear overlay.
 *
 * Apple philosophy: make success feel earned through restrained drama.
 * A brief, beautiful celebration that rewards the player without
 * interrupting flow. Appears for ~2.5 seconds then dissolves.
 *
 * Visual sequence:
 * 1. Screen dims slightly (0.3s)
 * 2. "WAVE X" title scales in with spring bounce (0.4s)
 * 3. "CLEARED" subtitle fades in below (0.2s later)
 * 4. Stats cards slide in from sides (staggered 0.15s each)
 * 5. Optional "PERFECT WAVE" badge pulses golden
 * 6. Everything dissolves out (0.5s)
 */

import { drawGlassPanel } from "../components/game/draw-helpers";

interface WaveCompleteState {
    startTime: number;
    waveNumber: number;
    enemiesKilled: number;
    perfect: boolean;
    combo: number;
    score: number;
    duration: number; // total display time in ms
}

let waveState: WaveCompleteState | null = null;

export function showWaveComplete(
    waveNumber: number,
    enemiesKilled: number,
    perfect: boolean,
    combo: number,
    score: number,
): void {
    waveState = {
        startTime: performance.now(),
        waveNumber,
        enemiesKilled,
        perfect,
        combo,
        score,
        duration: 2500,
    };
}

export function isWaveCompleteShowing(): boolean {
    if (!waveState) return false;
    const elapsed = performance.now() - waveState.startTime;
    if (elapsed > waveState.duration) {
        waveState = null;
        return false;
    }
    return true;
}

export function renderWaveComplete(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
): void {
    if (!waveState) return;

    const elapsed = time - waveState.startTime;
    const t = elapsed / waveState.duration; // 0..1

    // --- Easing ---
    // Fade in: 0-15%, hold: 15-75%, fade out: 75-100%
    const fadeIn = Math.min(1, t / 0.15);
    const fadeOut = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
    const alpha = Math.min(fadeIn, fadeOut);

    if (alpha <= 0) { waveState = null; return; }

    ctx.save();
    ctx.globalAlpha = alpha;

    // --- Background dim ---
    const dimAlpha = Math.min(0.5, fadeIn * 0.5);
    ctx.fillStyle = `rgba(0,0,0,${dimAlpha})`;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // --- Title: "WAVE X" ---
    const titleProgress = Math.min(1, Math.max(0, (elapsed - 100) / 500));
    const titleScale = easeOutBack(titleProgress);
    const titleAlpha = titleProgress;

    ctx.save();
    ctx.globalAlpha = alpha * titleAlpha;
    ctx.translate(cx, cy - 40);
    ctx.scale(titleScale, titleScale);

    ctx.font = "800 52px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Glow
    ctx.shadowColor = "rgba(10,132,255,0.6)";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#0a84ff";
    ctx.fillText(`WAVE ${waveState.waveNumber}`, 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();

    // --- Subtitle: "CLEARED" ---
    const subProgress = Math.min(1, Math.max(0, (elapsed - 400) / 300));
    const subAlpha = easeOutCubic(subProgress);

    ctx.save();
    ctx.globalAlpha = alpha * subAlpha;
    ctx.font = "600 16px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.letterSpacing = "6px";
    ctx.fillText("CLEARED", cx, cy + 10);
    ctx.letterSpacing = "0px";
    ctx.restore();

    // --- Stats cards ---
    const stats = [
        { label: "KILLS", value: String(waveState.enemiesKilled), color: "#32d74b" },
        { label: "COMBO", value: String(waveState.combo), color: "#ff9f0a" },
        { label: "SCORE", value: String(waveState.score), color: "#0a84ff" },
    ];

    const cardW = 100;
    const cardH = 56;
    const gap = 12;
    const totalW = stats.length * cardW + (stats.length - 1) * gap;
    const startX = cx - totalW / 2;
    const cardY = cy + 40;

    stats.forEach((stat, i) => {
        const cardDelay = 500 + i * 150;
        const cardProgress = Math.min(1, Math.max(0, (elapsed - cardDelay) / 300));
        const cardScale = easeOutBack(cardProgress);

        const slideDir = i === 0 ? -1 : i === 2 ? 1 : 0;
        const slideOffset = (1 - cardProgress) * slideDir * 40;

        ctx.save();
        const cardX = startX + i * (cardW + gap) + cardW / 2 + slideOffset;
        ctx.globalAlpha = alpha * cardProgress;
        ctx.translate(cardX, cardY + cardH / 2);
        ctx.scale(cardScale, cardScale);
        ctx.translate(-cardX, -(cardY + cardH / 2));

        drawGlassPanel(ctx, startX + i * (cardW + gap), cardY, cardW, cardH, 10);

        // Label
        ctx.font = "500 9px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(stat.label, cardX, cardY + 10);

        // Value
        ctx.font = "700 20px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = stat.color;
        ctx.textBaseline = "bottom";
        ctx.fillText(stat.value, cardX, cardY + cardH - 8);

        ctx.restore();
    });

    // --- Perfect Wave badge ---
    if (waveState.perfect) {
        const perfectDelay = 1000;
        const perfectProgress = Math.min(1, Math.max(0, (elapsed - perfectDelay) / 400));
        const perfectScale = easeOutBack(perfectProgress);
        const perfectPulse = Math.sin(time * 0.005) * 0.1 + 0.9;

        ctx.save();
        ctx.globalAlpha = alpha * perfectProgress * perfectPulse;
        ctx.translate(cx, cardY + cardH + 30);
        ctx.scale(perfectScale, perfectScale);

        // Golden badge
        drawGlassPanel(ctx, -60, -14, 120, 28, 14);

        ctx.font = "700 12px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "rgba(255,215,0,0.5)";
        ctx.shadowBlur = 12;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u2605 PERFECT WAVE \u2605", 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    ctx.restore();
}

// --- Easing helpers ---

function easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}
