/**
 * Combo Visual Effects - Refined Apple-style effects for high combos.
 *
 * Progressive visual intensity as combo builds:
 *   3+   : Subtle screen pulse
 *   10+  : Edge glow pulse
 *   15+  : Speed lines radiating from center
 *   20+  : Full-screen golden aura
 */

import { COLORS } from '../components/game/colors';

interface ComboFxState {
    flashIntensity: number;   // 0-1, decays over time
    flashColor: string;
    pulsePhase: number;
    saturation: number;       // 0-1
    speedLineAlpha: number;   // 0-1
    lastComboTrigger: number; // combo level that last triggered a milestone
}

const MILESTONES = [5, 10, 15, 20, 25, 30];

let fx: ComboFxState = {
    flashIntensity: 0, flashColor: '#ffffff', pulsePhase: 0,
    saturation: 0, speedLineAlpha: 0, lastComboTrigger: 0,
};

export function resetComboFx(): void {
    fx = { flashIntensity: 0, flashColor: '#ffffff', pulsePhase: 0, saturation: 0, speedLineAlpha: 0, lastComboTrigger: 0 };
}

export function triggerComboFlash(combo: number): void {
    const milestone = MILESTONES.filter(m => m <= combo).pop();
    if (milestone && milestone > fx.lastComboTrigger) {
        fx.flashIntensity = 0.5 + Math.min(0.3, combo * 0.015);
        fx.lastComboTrigger = milestone;
        if (combo >= 20) fx.flashColor = COLORS.combo20;
        else if (combo >= 15) fx.flashColor = COLORS.combo15;
        else if (combo >= 10) fx.flashColor = COLORS.combo10;
        else fx.flashColor = COLORS.combo3;
    } else if (combo >= 10) {
        fx.flashIntensity = Math.max(fx.flashIntensity, 0.12);
        fx.flashColor = combo >= 20 ? COLORS.combo20 : combo >= 15 ? COLORS.combo15 : COLORS.combo10;
    }
}

export function updateComboFx(dt: number, combo: number): void {
    // Decay flash
    fx.flashIntensity *= Math.pow(0.82, dt * 60);
    if (fx.flashIntensity < 0.01) fx.flashIntensity = 0;

    // Update saturation based on combo
    const targetSat = Math.min(1, Math.max(0, (combo - 5) / 15));
    fx.saturation += (targetSat - fx.saturation) * dt * 3;

    // Update speed lines
    const targetSpeedLines = Math.min(1, Math.max(0, (combo - 15) / 10));
    fx.speedLineAlpha += (targetSpeedLines - fx.speedLineAlpha) * dt * 3;

    // Update pulse
    fx.pulsePhase += dt * (2 + combo * 0.08);
}

export function drawComboFx(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, combo: number): void {
    if (combo < 3 && fx.flashIntensity < 0.01 && fx.saturation < 0.01) return;

    // Screen flash overlay
    if (fx.flashIntensity > 0.01) {
        ctx.save();
        ctx.globalAlpha = fx.flashIntensity;
        ctx.fillStyle = fx.flashColor;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    // Pulse vignette at combo 3+
    if (combo >= 3) {
        const pulse = Math.sin(fx.pulsePhase) * 0.08 + 0.08;
        const pulseGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
        pulseGrad.addColorStop(0, 'rgba(0,0,0,0)');
        pulseGrad.addColorStop(1, 'rgba(0,0,0,' + pulse + ')');
        ctx.fillStyle = pulseGrad;
        ctx.fillRect(0, 0, w, h);
    }

    // Speed lines at combo 15+
    if (fx.speedLineAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = fx.speedLineAlpha * 0.2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        const lineCount = 10;
        const centerX = w / 2;
        const centerY = h / 2;
        const maxLen = Math.max(w, h) * 0.5;

        for (let i = 0; i < lineCount; i++) {
            const angle = (Math.PI * 2 / lineCount) * i + time * 0.0008;
            const inner = 120 + Math.sin(time * 0.002 + i) * 40;
            const outer = inner + maxLen * (0.3 + Math.sin(time * 0.004 + i * 2) * 0.15);

            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
            ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Edge glow at combo 10+
    if (combo >= 10) {
        const glowAlpha = Math.min(0.12, (combo - 10) * 0.008);
        let glowRGB: string;
        if (combo >= 20) glowRGB = '255,215,0';
        else if (combo >= 15) glowRGB = '255,59,92';
        else glowRGB = '191,90,242';

        // Top edge
        const topGrad = ctx.createLinearGradient(0, 0, 0, 50);
        topGrad.addColorStop(0, 'rgba(' + glowRGB + ',' + glowAlpha + ')');
        topGrad.addColorStop(1, 'rgba(' + glowRGB + ',0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, 50);

        // Bottom edge
        const botGrad = ctx.createLinearGradient(0, h - 50, 0, h);
        botGrad.addColorStop(0, 'rgba(' + glowRGB + ',0)');
        botGrad.addColorStop(1, 'rgba(' + glowRGB + ',' + glowAlpha + ')');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, h - 50, w, 50);
    }
}
