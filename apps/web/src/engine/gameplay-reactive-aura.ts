/**
 * Gameplay Reactive Aura
 *
 * A unified visual system that connects gameplay state to canvas-level effects.
 * This is the "atmosphere" layer that makes the game feel alive.
 *
 * Apple philosophy: visual feedback should feel like a natural consequence
 * of the player's actions, not a decoration bolted on top.
 *
 * Three reactive layers:
 * 1. Proximity Pulse - screen edges glow when enemies are near the bottom
 * 2. Combo Atmosphere - ambient color shift and particle density
 * 3. Typing Ripple - subtle radial pulse on correct keystrokes
 */

import { COLORS } from '../components/game/colors';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface AuraState {
    // Proximity pulse
    dangerAlpha: number;        // 0-1, based on closest enemy to bottom
    dangerColor: string;

    // Combo atmosphere
    comboIntensity: number;     // 0-1, based on combo level
    comboHue: number;           // current hue offset
    ambientPulse: number;       // 0-1, breathing animation

    // Typing ripple
    ripples: TypingRipple[];

    // Screen-edge chromatic fringe
    fringeIntensity: number;    // 0-1
}

interface TypingRipple {
    x: number;
    y: number;
    startTime: number;
    color: string;
    maxRadius: number;
}

let state: AuraState = {
    dangerAlpha: 0, dangerColor: COLORS.error,
    comboIntensity: 0, comboHue: 0, ambientPulse: 0,
    ripples: [], fringeIntensity: 0,
};

export function resetGameplayAura(): void {
    state = {
        dangerAlpha: 0, dangerColor: COLORS.error,
        comboIntensity: 0, comboHue: 0, ambientPulse: 0,
        ripples: [], fringeIntensity: 0,
    };
}

// ---------------------------------------------------------------------------
// Update (call every frame)
// ---------------------------------------------------------------------------

export function updateGameplayAura(
    dt: number,
    combo: number,
    enemies: any[],
    canvasHeight: number,
    score: number,
): void {
    // --- Proximity danger ---
    let closestToBottom = 0;
    if (enemies && enemies.length > 0) {
        for (const e of enemies) {
            if (!e.alive) continue;
            // Normalize: 0 = at spawn, 1 = at bottom
            const progress = e.y / canvasHeight;
            if (progress > closestToBottom) closestToBottom = progress;
        }
    }
    // Ramp up sharply when enemies pass 70% of screen
    const dangerTarget = closestToBottom > 0.7 ? Math.min(1, (closestToBottom - 0.7) / 0.25) : 0;
    state.dangerAlpha += (dangerTarget - state.dangerAlpha) * dt * 6;
    if (state.dangerAlpha < 0.005) state.dangerAlpha = 0;

    // --- Combo atmosphere ---
    const comboTarget = Math.min(1, combo / 20);
    state.comboIntensity += (comboTarget - state.comboIntensity) * dt * 4;

    // Combo hue shifts from blue (low) to gold (high)
    const targetHue = combo * 4; // degrees of hue shift
    state.comboHue += (targetHue - state.comboHue) * dt * 3;

    // Ambient pulse - breathing tied to combo
    state.ambientPulse = Math.sin(performance.now() * 0.003) * 0.5 + 0.5;
    state.ambientPulse *= state.comboIntensity;

    // --- Fringe intensity ---
    const fringeTarget = Math.min(1, Math.max(0, (combo - 8) / 12));
    state.fringeIntensity += (fringeTarget - state.fringeIntensity) * dt * 5;

    // --- Decay ripples ---
    state.ripples = state.ripples.filter(r => performance.now() - r.startTime < 800);
}

// ---------------------------------------------------------------------------
// Trigger events
// ---------------------------------------------------------------------------

export function triggerTypingRipple(x: number, y: number, isCorrect: boolean): void {
    state.ripples.push({
        x, y,
        startTime: performance.now(),
        color: isCorrect ? COLORS.success : COLORS.error,
        maxRadius: isCorrect ? 60 : 40,
    });
    // Keep only last 8 ripples
    if (state.ripples.length > 8) state.ripples.shift();
}

// ---------------------------------------------------------------------------
// Render (call after background, before enemies)
// ---------------------------------------------------------------------------

export function renderGameplayAura(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
): void {
    // --- Proximity danger vignette ---
    if (state.dangerAlpha > 0.01) {
        const alpha = state.dangerAlpha * 0.6;
        const grad = ctx.createRadialGradient(w / 2, h, h * 0.1, w / 2, h * 0.3, h * 0.9);
        grad.addColorStop(0, `rgba(255,50,50,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,30,30,${alpha * 0.4})`);
        grad.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // --- Combo ambient glow ---
    if (state.comboIntensity > 0.05) {
        const alpha = state.comboIntensity * 0.12 * (0.8 + state.ambientPulse * 0.2);
        const hue = Math.round(state.comboHue);
        const color = `hsla(${45 + hue}, 100%, 60%, ${alpha})`;
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // --- Typing ripples ---
    for (const ripple of state.ripples) {
        const elapsed = (time - ripple.startTime) / 800; // 0-1 over lifetime
        if (elapsed >= 1) continue;

        const radius = ripple.maxRadius * easeOutCubic(elapsed);
        const alpha = (1 - elapsed) * 0.35;

        ctx.save();
        ctx.strokeStyle = ripple.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2 * (1 - elapsed);
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow ring
        ctx.strokeStyle = "rgba(255,255,255," + (alpha * 0.5) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // --- Chromatic fringe (screen edges) ---
    if (state.fringeIntensity > 0.02) {
        const alpha = state.fringeIntensity * 0.15;
        const fringeWidth = 80 + state.fringeIntensity * 60;

        // Left edge - red
        const leftGrad = ctx.createLinearGradient(0, 0, fringeWidth, 0);
        leftGrad.addColorStop(0, `rgba(255,50,50,${alpha})`);
        leftGrad.addColorStop(1, "rgba(255,50,50,0)");
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, fringeWidth, h);

        // Right edge - cyan
        const rightGrad = ctx.createLinearGradient(w, 0, w - fringeWidth, 0);
        rightGrad.addColorStop(0, `rgba(50,200,255,${alpha})`);
        rightGrad.addColorStop(1, "rgba(50,200,255,0)");
        ctx.fillStyle = rightGrad;
        ctx.fillRect(w - fringeWidth, 0, fringeWidth, h);

        // Bottom edge - warm
        const bottomGrad = ctx.createLinearGradient(0, h, 0, h - fringeWidth * 0.5);
        bottomGrad.addColorStop(0, `rgba(255,150,50,${alpha * 0.5})`);
        bottomGrad.addColorStop(1, "rgba(255,150,50,0)");
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, h - fringeWidth * 0.5, w, fringeWidth * 0.5);
    }
}

// ---------------------------------------------------------------------------
// Render HUD danger indicator
// ---------------------------------------------------------------------------

export function renderDangerIndicator(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
): void {
    if (state.dangerAlpha < 0.05) return;

    const barWidth = w * 0.6;
    const barHeight = 3;
    const barX = (w - barWidth) / 2;
    const barY = h - 16;

    // Background
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 1.5);
    ctx.fill();

    // Fill
    const fillAlpha = 0.3 + state.dangerAlpha * 0.7;
    ctx.fillStyle = `rgba(255,50,50,${fillAlpha})`;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * state.dangerAlpha, barHeight, 1.5);
    ctx.fill();

    // Pulsing text
    if (state.dangerAlpha > 0.5) {
        const pulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = state.dangerAlpha * pulse;
        ctx.font = "600 9px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.error;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("DANGER", w / 2, barY - 3);
        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// Get current aura state for external queries
export function getAuraState(): { dangerAlpha: number; comboIntensity: number; fringeIntensity: number } {
    return {
        dangerAlpha: state.dangerAlpha,
        comboIntensity: state.comboIntensity,
        fringeIntensity: state.fringeIntensity,
    };
}
