/**
 * Advanced Particle System with trail rendering, glow compositing, and turbulence.
 */

export interface ParticleConfig {
    x: number;
    y: number;
    count: number;
    color: string;
    spread?: number;
    speed?: number;
    size?: number;
    lifetime?: number;
    gravity?: number;
    turbulence?: number;
    glow?: number;
    trail?: boolean;
    trailLength?: number;
}

interface Particle {
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; color: string;
    size: number; baseSize: number; gravity: number;
    turbulence: number; glow: number; trail: boolean;
    trailHistory: { x: number; y: number }[]; trailLength: number; phase: number;
}

export class ParticleSystem {
    private pool: Particle[] = [];
    private active: Particle[] = [];

    emit(config: ParticleConfig): void {
        // Performance: cap active particles to prevent frame drops
        if (this.active.length > 500) return;
        const { x, y, count, color, spread = Math.PI * 2, speed = 3, size = 3, lifetime = 0.8, gravity = 0, turbulence = 0, glow = 0.6, trail = false, trailLength = 8 } = config;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * spread;
            const vel = speed * (0.5 + Math.random() * 0.5);
            const life = lifetime * (0.6 + Math.random() * 0.4);
            const p = this.pool.pop() || ({} as Particle);
            p.x = x; p.y = y;
            p.vx = Math.cos(angle) * vel;
            p.vy = Math.sin(angle) * vel;
            p.life = life; p.maxLife = life;
            p.color = color;
            p.size = size * (0.5 + Math.random() * 0.5);
            p.baseSize = p.size;
            p.gravity = gravity; p.turbulence = turbulence; p.glow = glow;
            p.trail = trail; p.trailHistory = []; p.trailLength = trailLength;
            p.phase = Math.random() * Math.PI * 2;
            this.active.push(p);
        }
    }

    update(dt: number): void {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.life -= dt;
            if (p.life <= 0) { this.pool.push(p); this.active.splice(i, 1); continue; }
            if (p.trail) {
                p.trailHistory.push({ x: p.x, y: p.y }); if (p.trailHistory.length > p.trailLength) p.trailHistory.shift();
                if (p.trailHistory.length > p.trailLength) p.trailHistory.shift();
            }
            if (p.turbulence > 0) {
                const t = p.maxLife - p.life;
                p.vx += (Math.sin(t * 8 + p.phase) * 0.3 + Math.sin(t * 13 + p.phase * 2) * 0.2) * p.turbulence * dt * 60;
                p.vy += (Math.cos(t * 10 + p.phase) * 0.3 + Math.cos(t * 17 + p.phase * 3) * 0.2) * p.turbulence * dt * 60;
            }
            p.vy += p.gravity * dt;
            p.vx *= 0.97; p.vy *= 0.97;
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.size = p.baseSize * (p.life / p.maxLife);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        for (const p of this.active) {
            const lifeRatio = p.life / p.maxLife;
            const alpha = lifeRatio * 0.9;
            if (p.trail && p.trailHistory.length > 1) {
                ctx.save();
                ctx.lineCap = "round";
                for (let j = 0; j < p.trailHistory.length - 1; j++) {
                    const t = (j + 1) / p.trailHistory.length;
                    const pt = p.trailHistory[j];
                    const next = p.trailHistory[j + 1];
                    ctx.globalAlpha = alpha * t * 0.4;
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = p.size * t * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(pt.x, pt.y);
                    ctx.lineTo(next.x, next.y);
                    ctx.stroke();
                }
                ctx.restore();
            }
            if (p.glow > 0) {
                ctx.save();
                ctx.globalAlpha = alpha * p.glow * 0.3;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.size * 3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.size * 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    get count(): number { return this.active.length; }
    clear(): void { this.pool.push(...this.active); this.active.length = 0; }
}

export class ScreenShake {
    intensity = 0;
    private decay = 0.88;
    trigger(amount: number): void { this.intensity = Math.min(this.intensity + amount, 18); }
    update(dt: number): void {
        this.intensity *= Math.pow(this.decay, dt * 60);
        if (this.intensity < 0.1) this.intensity = 0;
    }
    getOffset(): { x: number; y: number } {
        if (this.intensity < 0.1) return { x: 0, y: 0 };
        return { x: (Math.random() - 0.5) * this.intensity * 2, y: (Math.random() - 0.5) * this.intensity * 2 };
    }
}