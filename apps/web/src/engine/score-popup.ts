/**
 * Score Popup System - floating score text with spring physics and fade trail.
 *
 * Apple philosophy: score feedback should feel like a physical object
 * being gently lifted by an updraft, not a rigid UI element.
 */

export interface ScorePopupConfig {
    x: number;
    y: number;
    text: string;
    color?: string;
    fontSize?: number;
    drift?: number;
}

interface Popup {
    x: number; y: number; targetY: number;
    vx: number; vy: number;
    text: string; color: string; fontSize: number;
    life: number; maxLife: number;
    trail: { x: number; y: number; alpha: number }[];
    wobblePhase: number;
}

export class ScorePopupSystem {
    private popups: Popup[] = [];

    emit(config: ScorePopupConfig): void {
        const { x, y, text, color = "#ffd60a", fontSize = 18, drift = -60 } = config;
        this.popups.push({
            x, y,
            targetY: y + drift,
            vx: (Math.random() - 0.5) * 20,
            vy: drift / 0.8,
            text, color, fontSize,
            life: 0.8, maxLife: 0.8,
            trail: [],
            wobblePhase: Math.random() * Math.PI * 2,
        });
    }

    update(dt: number): void {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            p.life -= dt;
            if (p.life <= 0) { this.popups.splice(i, 1); continue; }

            // Store trail
            p.trail.push({ x: p.x, y: p.y, alpha: (p.life / p.maxLife) * 0.3 });
            if (p.trail.length > 6) p.trail.shift();

            // Spring physics: velocity toward target with damping
            const springK = 3;
            const damping = 0.92;
            const dy = p.targetY - p.y;
            p.vy += dy * springK * dt;
            p.vy *= damping;
            p.vx *= 0.95;

            // Wobble
            const wobble = Math.sin((p.maxLife - p.life) * 8 + p.wobblePhase) * 8;

            p.x += (p.vx + wobble) * dt;
            p.y += p.vy * dt;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        for (const p of this.popups) {
            const lifeRatio = p.life / p.maxLife;

            // Draw trail
            for (const t of p.trail) {
                ctx.save();
                ctx.globalAlpha = t.alpha * 0.4;
                ctx.font = "bold " + (p.fontSize * 0.8) + "px -apple-system, SF Pro Display, system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = p.color;
                ctx.fillText(p.text, t.x, t.y);
                ctx.restore();
            }

            // Scale and fade
            const scale = 0.8 + lifeRatio * 0.4;
            const alpha = Math.min(1, lifeRatio * 2);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.scale(scale, scale);

            // Glow
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;

            ctx.font = "bold " + p.fontSize + "px -apple-system, SF Pro Display, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, 0, 0);

            ctx.restore();
        }
    }

    get count(): number { return this.popups.length; }
    clear(): void { this.popups.length = 0; }
}