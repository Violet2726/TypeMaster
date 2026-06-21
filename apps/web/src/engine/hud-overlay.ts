/**
 * HUD Overlay - Enhanced heads-up display with animations.
 *
 * Improvements over basic HUD:
 * - Animated score counter (smooth interpolation)
 * - Wave progress bar (enemies remaining)
 * - Combo meter (visual fill bar)
 * - Better life display with loss animation
 * - Compact layout with better typography
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";



// Responsive scaling based on canvas size
function getScale(w: number, h: number): number {
    const base = 800; // reference width
    return Math.max(0.6, Math.min(1.2, w / base));
}

// ---------------------------------------------------------------------------
// Animated State
// ---------------------------------------------------------------------------

interface HudState {
    displayScore: number;
    targetScore: number;
    scoreVelocity: number;
    lifeFlash: number;        // flash when losing a life
    lastLives: number;
    comboMeter: number;       // 0-1 fill
}

let hud: HudState = {
    displayScore: 0, targetScore: 0, scoreVelocity: 0,
    lifeFlash: 0, lastLives: 5, comboMeter: 0,
};

export function resetHud(): void {
    hud = { displayScore: 0, targetScore: 0, scoreVelocity: 0, lifeFlash: 0, lastLives: 5, comboMeter: 0 };
}

export function updateHud(dt: number, score: number, lives: number, combo: number): void {
    // Smooth score interpolation
    hud.targetScore = score;
    const scoreDiff = hud.targetScore - hud.displayScore;
    hud.scoreVelocity += scoreDiff * 8 * dt;
    hud.scoreVelocity *= 0.85;
    hud.displayScore += hud.scoreVelocity;
    if (Math.abs(scoreDiff) < 1) { hud.displayScore = score; hud.scoreVelocity = 0; }

    // Life loss flash
    if (lives < hud.lastLives) {
        hud.lifeFlash = 1;
    }
    hud.lastLives = lives;
    hud.lifeFlash *= Math.pow(0.9, dt * 60);
    if (hud.lifeFlash < 0.01) hud.lifeFlash = 0;

    // Combo meter (fills up every 5 hits)
    const comboTarget = (combo % 5) / 5;
    hud.comboMeter += (comboTarget - hud.comboMeter) * dt * 5;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function drawEnhancedHud(
    ctx: CanvasRenderingContext2D,
    w: number, h: number, time: number,
    state: any, copy: any,
): void {
    ctx.save();
    const s = getScale(w, h);

    // --- Top bar ---
    const barH = Math.round(52 * s);
    drawGlassPanel(ctx, 16, 12, w - 32, barH, Math.round(16 * s));

    // Score (left) with animated counter
    ctx.font = (9 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(copy.score.toUpperCase(), 32, Math.round(18 * s));

    ctx.font = "700 " + Math.round(20 * s) + "px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textBaseline = "bottom";
    ctx.fillText(String(Math.round(hud.displayScore)), 32, Math.round(54 * s));

    // Wave (center) with progress
    ctx.font = (9 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(copy.wave.toUpperCase(), w / 2, Math.round(18 * s));

    ctx.font = "600 " + Math.round(18 * s) + "px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textBaseline = "bottom";
    ctx.fillText(String(state.wave), w / 2, Math.round(54 * s));

    // Wave progress bar (mini)
    const waveProgress = state.waveQueue.length > 0 ? state.nextSpawnIndex / state.waveQueue.length : 0;
    const barW = Math.round(60 * s);
    const barX = w / 2 - barW / 2;
    const barY = Math.round(56 * s);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, 3, 1.5);
    ctx.fill();
    ctx.fillStyle = COLORS.textTertiary;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * waveProgress, 3, 1.5);
    ctx.fill();

    // Lives (right) with loss flash
    const lifeFlashAlpha = hud.lifeFlash;
    if (lifeFlashAlpha > 0.01) {
        ctx.fillStyle = "rgba(255,69,58," + (lifeFlashAlpha * 0.3) + ")";
        ctx.fillRect(0, 0, w, h);
    }

    ctx.textAlign = "right";
    for (let i = 0; i < state.maxLives; i++) {
        const lx = w - 32 - (state.maxLives - 1 - i) * 18;
        const alive = i < state.lives;
        const pulse = alive ? Math.sin(time * 0.004 + i) * 0.15 + 0.85 : 0.25;
        const size = alive ? 6 : 4;

        ctx.globalAlpha = pulse;
        ctx.fillStyle = alive ? COLORS.error : COLORS.textTertiary;

        // Heart shape for alive, empty circle for lost
        if (alive) {
            ctx.beginPath();
            ctx.arc(lx, 40, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = COLORS.error;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.beginPath();
            ctx.arc(lx, 40, size, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // --- Combo meter (below top bar, center) ---
    if (state.combo >= 2) {
        const meterW = Math.round(120 * s);
        const meterH = Math.round(6 * s);
        const meterX = w / 2 - meterW / 2;
        const meterY = Math.round(68 * s);

        // Background bar
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.roundRect(meterX, meterY, meterW, meterH, 3);
        ctx.fill();

        // Fill with combo color
        const comboColor = state.combo >= 20 ? "#ffd700" : state.combo >= 10 ? "#ff453a" : state.combo >= 5 ? "#bf5af2" : "#0a84ff";
        ctx.fillStyle = comboColor;
        ctx.shadowColor = comboColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(meterX, meterY, meterW * hud.comboMeter, meterH, 3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Combo label
        ctx.font = "600 " + Math.round(10 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = comboColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const mult = 1 + Math.floor(state.combo / 5) * 0.5;
        ctx.fillText("x" + mult.toFixed(1), w / 2, meterY + Math.round(10 * s));
    }

    // --- Active input display (centered, below combo) ---
    if (state.typedInput) {
        const inputY = Math.round(90 * s);
        drawGlassPanel(ctx, w / 2 - 80, inputY, 160, Math.round(28 * s), Math.round(8 * s));
        ctx.font = "500 " + Math.round(14 * s) + "px SF Mono, Cascadia Mono, monospace";
        ctx.fillStyle = COLORS.success;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(state.typedInput, w / 2, inputY + Math.round(14 * s));
    }

    // --- Breathing wave indicator (top-right corner) ---
    if (state.wave > 0 && state.wave % 5 === 0) {
        const breathAlpha = 0.4 + Math.sin(time * 0.003) * 0.2;
        ctx.font = "600 " + Math.round(11 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = "rgba(52, 199, 89, " + breathAlpha + ")";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("BREATHING WAVE", w - 20, Math.round(18 * s));
    }

    // --- Performance indicator (bottom-left) ---
    if (state._performanceScore !== undefined) {
        const score = state._performanceScore;
        const label = score >= 0.7 ? "FLOW" : score >= 0.4 ? "STEADY" : "RECOVERING";
        const color = score >= 0.7 ? "#34c759" : score >= 0.4 ? "#ffcc02" : "#ff3b5c";
        ctx.font = "500 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(label, 20, h - 30);
        ctx.globalAlpha = 1;
    }

    // --- KPS indicator (bottom-left) ---
    if (state.kps > 0) {
        ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText((Math.round(state.kps * 10) / 10) + " kps", 20, h - 16);
    }

    ctx.restore();
}