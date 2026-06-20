/**
 * Combo Visual Effects - Full-screen effects for high combos.
 *
 * Progressive visual intensity as combo builds:
 *   3+   : Subtle screen pulse
 *   5+   : Color saturation boost
 *   10+  : Screen flash on each kill
 *   15+  : Speed lines radiating from center
 *   20+  : Full-screen color shift + intense flash
 */

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
    flashIntensity: 0, flashColor: "#ffffff", pulsePhase: 0,
    saturation: 0, speedLineAlpha: 0, lastComboTrigger: 0,
};

export function resetComboFx(): void {
    fx = { flashIntensity: 0, flashColor: "#ffffff", pulsePhase: 0, saturation: 0, speedLineAlpha: 0, lastComboTrigger: 0 };
}

export function triggerComboFlash(combo: number): void {
    // Check if we hit a new milestone
    const milestone = MILESTONES.filter(m => m <= combo).pop();
    if (milestone && milestone > fx.lastComboTrigger) {
        fx.flashIntensity = 0.6 + Math.min(0.4, combo * 0.02);
        fx.lastComboTrigger = milestone;
        // Color based on milestone
        if (combo >= 20) fx.flashColor = "#ffd700";
        else if (combo >= 15) fx.flashColor = "#ff453a";
        else if (combo >= 10) fx.flashColor = "#bf5af2";
        else fx.flashColor = "#0a84ff";
    } else if (combo >= 10) {
        // Subtle flash on each kill at high combo
        fx.flashIntensity = Math.max(fx.flashIntensity, 0.15);
        fx.flashColor = combo >= 20 ? "#ffd700" : combo >= 15 ? "#ff6b6b" : "#bf5af2";
    }
}

export function updateComboFx(dt: number, combo: number): void {
    // Decay flash
    fx.flashIntensity *= Math.pow(0.85, dt * 60);
    if (fx.flashIntensity < 0.01) fx.flashIntensity = 0;

    // Update saturation based on combo
    const targetSat = Math.min(1, Math.max(0, (combo - 5) / 15));
    fx.saturation += (targetSat - fx.saturation) * dt * 3;

    // Update speed lines
    const targetSpeedLines = Math.min(1, Math.max(0, (combo - 15) / 10));
    fx.speedLineAlpha += (targetSpeedLines - fx.speedLineAlpha) * dt * 3;

    // Update pulse
    fx.pulsePhase += dt * (2 + combo * 0.1);
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
        const pulse = Math.sin(fx.pulsePhase) * 0.1 + 0.1;
        const pulseGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, h * 0.9);
        pulseGrad.addColorStop(0, "rgba(0,0,0,0)");
        pulseGrad.addColorStop(1, "rgba(0,0,0," + pulse + ")");
        ctx.fillStyle = pulseGrad;
        ctx.fillRect(0, 0, w, h);
    }

    // Speed lines at combo 15+
    if (fx.speedLineAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = fx.speedLineAlpha * 0.3;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;

        const lineCount = 12;
        const centerX = w / 2;
        const centerY = h / 2;
        const maxLen = Math.max(w, h) * 0.6;

        for (let i = 0; i < lineCount; i++) {
            const angle = (Math.PI * 2 / lineCount) * i + time * 0.001;
            const inner = 100 + Math.sin(time * 0.003 + i) * 30;
            const outer = inner + maxLen * (0.3 + Math.sin(time * 0.005 + i * 2) * 0.2);

            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
            ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Edge glow at combo 10+
    if (combo >= 10) {
        const glowAlpha = Math.min(0.15, (combo - 10) * 0.01);
        const glowColor = combo >= 20 ? "255,215,0" : combo >= 15 ? "255,69,58" : "191,90,242";

        // Top edge
        const topGrad = ctx.createLinearGradient(0, 0, 0, 60);
        topGrad.addColorStop(0, "rgba(" + glowColor + "," + glowAlpha + ")");
        topGrad.addColorStop(1, "rgba(" + glowColor + ",0)");
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, 60);

        // Bottom edge
        const botGrad = ctx.createLinearGradient(0, h - 60, 0, h);
        botGrad.addColorStop(0, "rgba(" + glowColor + ",0)");
        botGrad.addColorStop(1, "rgba(" + glowColor + "," + glowAlpha + ")");
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, h - 60, w, 60);
    }
}