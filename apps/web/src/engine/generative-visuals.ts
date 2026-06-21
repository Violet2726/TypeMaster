/**
 * Generative Visual System
 *
 * Replaces the static gradient background with a living field of light.
 * Three particle layers create depth: far (ambient stars), mid (combo-reactive),
 * near (typing-reactive energy).  The entire palette shifts with game state.
 *
 * Design philosophy: Apple-grade restraint - every effect serves clarity,
 * nothing is decorative noise.
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    baseAlpha: number;
    phase: number;
    layer: 'far' | 'mid' | 'near';
}

export interface VisualState {
    combo: number;
    maxCombo: number;
    danger: number;
    wave: number;
    typingIntensity: number;
    bossActive: boolean;
    paused: boolean;
}

interface ColorScheme {
    bgTop: string;
    bgBottom: string;
    farParticle: string;
    midParticle: string;
    nearParticle: string;
    auraCenter: string;
    auraEdge: string;
}

const SCHEMES: Record<string, ColorScheme> = {
    calm: {
        bgTop: '#0a0e1a',
        bgBottom: '#111827',
        farParticle: 'rgba(120, 140, 200, 0.4)',
        midParticle: 'rgba(100, 160, 255, 0.3)',
        nearParticle: 'rgba(140, 180, 255, 0.5)',
        auraCenter: 'rgba(59, 130, 246, 0.08)',
        auraEdge: 'rgba(59, 130, 246, 0.0)',
    },
    combo: {
        bgTop: '#0f0a1a',
        bgBottom: '#1a1127',
        farParticle: 'rgba(200, 160, 255, 0.4)',
        midParticle: 'rgba(168, 85, 247, 0.35)',
        nearParticle: 'rgba(232, 180, 255, 0.5)',
        auraCenter: 'rgba(168, 85, 247, 0.1)',
        auraEdge: 'rgba(168, 85, 247, 0.0)',
    },
    danger: {
        bgTop: '#1a0a0a',
        bgBottom: '#271111',
        farParticle: 'rgba(255, 120, 100, 0.35)',
        midParticle: 'rgba(255, 80, 60, 0.3)',
        nearParticle: 'rgba(255, 100, 80, 0.45)',
        auraCenter: 'rgba(239, 68, 68, 0.1)',
        auraEdge: 'rgba(239, 68, 68, 0.0)',
    },
    boss: {
        bgTop: '#0a0a1a',
        bgBottom: '#1a1a27',
        farParticle: 'rgba(255, 200, 100, 0.35)',
        midParticle: 'rgba(255, 170, 50, 0.3)',
        nearParticle: 'rgba(255, 220, 150, 0.45)',
        auraCenter: 'rgba(255, 170, 50, 0.12)',
        auraEdge: 'rgba(255, 170, 50, 0.0)',
    },
};

export class GenerativeVisualSystem {
    private particles: Particle[] = [];
    private w = 800;
    private h = 600;
    private state: VisualState = {
        combo: 0, maxCombo: 20, danger: 0, wave: 1,
        typingIntensity: 0, bossActive: false, paused: false,
    };
    private currentScheme: ColorScheme = { ...SCHEMES.calm };
    private targetScheme: ColorScheme = { ...SCHEMES.calm };
    private blendProgress = 1;
    private waveOffset = 0;
    private scrollX = 0;
    private scrollY = 0;
    private targetScrollY = 0;

    // Typing ripple system
    private ripples: Array<{
        x: number; y: number; radius: number; maxRadius: number;
        alpha: number; color: string; speed: number;
    }> = [];

    private bursts: Array<{
        x: number; y: number; radius: number; maxRadius: number;
        alpha: number; color: string; speed: number;
    }> = [];

    constructor() {
        this.initParticles();
    }

    resize(w: number, h: number): void {
        this.w = w;
        this.h = h;
        this.initParticles();
    }

    private initParticles(): void {
        this.particles = [];
        const area = this.w * this.h;
        const farCount = Math.floor(area / 12000);
        for (let i = 0; i < farCount; i++) this.particles.push(this.createParticle('far'));
        const midCount = Math.floor(area / 18000);
        for (let i = 0; i < midCount; i++) this.particles.push(this.createParticle('mid'));
        const nearCount = Math.floor(area / 28000);
        for (let i = 0; i < nearCount; i++) this.particles.push(this.createParticle('near'));
    }

    private createParticle(layer: 'far' | 'mid' | 'near'): Particle {
        const configs = {
            far:  { sizeRange: [0.5, 1.5], speedRange: [0.05, 0.15], alphaRange: [0.15, 0.35] },
            mid:  { sizeRange: [1.0, 2.5], speedRange: [0.1, 0.3],   alphaRange: [0.1, 0.25] },
            near: { sizeRange: [2.0, 4.0], speedRange: [0.2, 0.5],   alphaRange: [0.08, 0.2] },
        };
        const cfg = configs[layer];
        const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]);
        const speed = cfg.speedRange[0] + Math.random() * (cfg.speedRange[1] - cfg.speedRange[0]);
        const alpha = cfg.alphaRange[0] + Math.random() * (cfg.alphaRange[1] - cfg.alphaRange[0]);
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.random() * this.w,
            y: Math.random() * this.h,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (layer === 'near' ? 0.1 : 0.02),
            size, alpha, baseAlpha: alpha,
            phase: Math.random() * Math.PI * 2,
            layer,
        };
    }

    updateState(state: Partial<VisualState>): void {
        Object.assign(this.state, state);
        let target = SCHEMES.calm;
        if (state.bossActive) target = SCHEMES.boss;
        else if (state.danger !== undefined && state.danger > 0.6) target = SCHEMES.danger;
        else if (state.combo !== undefined && state.combo > 5) target = SCHEMES.combo;
        if (target.bgTop !== this.targetScheme.bgTop) {
            this.targetScheme = { ...target };
            this.blendProgress = 0;
        }
    }

    triggerRipple(x: number, y: number, color: string, intensity: number = 1): void {
        this.ripples.push({
            x, y, radius: 0,
            maxRadius: 40 + intensity * 80,
            alpha: 0.35 + intensity * 0.2,
            color, speed: 120 + intensity * 80,
        });
    }

    triggerBurst(x: number, y: number, color: string, intensity: number = 1): void {
        this.bursts.push({
            x, y, radius: 0,
            maxRadius: 80 + intensity * 120,
            alpha: 0.3 + intensity * 0.3,
            color, speed: 200 + intensity * 150,
        });
    }

    update(dt: number): void {
        if (this.state.paused) return;
        if (this.blendProgress < 1) {
            this.blendProgress = Math.min(1, this.blendProgress + dt * 1.5);
            this.currentScheme = this.blendSchemes(
                this.currentScheme, this.targetScheme, this.easeInOut(this.blendProgress)
            );
        }
        this.waveOffset += dt * 0.5;
        const comboBoost = Math.min(1, this.state.combo / this.state.maxCombo);
        const dangerBoost = this.state.danger;
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            const parallaxFactor = p.layer === 'near' ? 1.0 : p.layer === 'mid' ? 0.5 : 0.15;
            p.x += this.scrollX * parallaxFactor;
            p.y += this.scrollY * parallaxFactor * 0.3;
            const waveAmplitude = p.layer === 'near' ? 0.8 : p.layer === 'mid' ? 0.4 : 0.15;
            p.x += Math.sin(this.waveOffset + p.phase) * waveAmplitude;
            if (comboBoost > 0.2) {
                const orbitStrength = comboBoost * 0.3;
                p.x += Math.cos(this.waveOffset * 2 + p.phase) * orbitStrength;
                p.y += Math.sin(this.waveOffset * 2 + p.phase) * orbitStrength * 0.5;
            }
            if (dangerBoost > 0.3) p.vy += dangerBoost * 0.02;
            const intensityPulse = this.state.typingIntensity * 0.3;
            p.alpha = p.baseAlpha + Math.sin(this.waveOffset * 3 + p.phase) * intensityPulse * p.baseAlpha;
            p.vx *= 0.999;
            p.vy *= 0.999;
            if (p.x < -10) p.x = this.w + 10;
            if (p.x > this.w + 10) p.x = -10;
            if (p.y < -10) p.y = this.h + 10;
            if (p.y > this.h + 10) p.y = -10;
        }
        // Parallax scroll (subtle vertical drift based on game progress)
        this.targetScrollY = this.state.wave * 2;
        this.scrollY += (this.targetScrollY - this.scrollY) * 0.01;
        this.scrollX = Math.sin(this.waveOffset * 0.3) * 3;

        // Update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += r.speed * dt;
            r.alpha *= 0.96;
            if (r.alpha < 0.01 || r.radius > r.maxRadius) this.ripples.splice(i, 1);
        }

        for (let i = this.bursts.length - 1; i >= 0; i--) {
            const b = this.bursts[i];
            b.radius += b.speed * dt;
            b.alpha *= 0.97;
            if (b.alpha < 0.01 || b.radius > b.maxRadius) this.bursts.splice(i, 1);
        }
    }

    render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        if (w !== this.w || h !== this.h) this.resize(w, h);
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, this.currentScheme.bgTop);
        bgGrad.addColorStop(1, this.currentScheme.bgBottom);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        const auraGrad = ctx.createRadialGradient(w / 2, h * 0.6, 0, w / 2, h * 0.6, w * 0.6);
        auraGrad.addColorStop(0, this.currentScheme.auraCenter);
        auraGrad.addColorStop(1, this.currentScheme.auraEdge);
        ctx.fillStyle = auraGrad;
        ctx.fillRect(0, 0, w, h);
        for (const b of this.bursts) {
            ctx.save();
            ctx.globalAlpha = b.alpha;
            const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
            grad.addColorStop(0, b.color + '40');
            grad.addColorStop(0.5, b.color + '15');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // Ripples (spatial typing feedback)
        for (const r of this.ripples) {
            ctx.save();
            ctx.globalAlpha = r.alpha;
            const rGrad = ctx.createRadialGradient(r.x, r.y, r.radius * 0.7, r.x, r.y, r.radius);
            rGrad.addColorStop(0, 'transparent');
            rGrad.addColorStop(0.7, r.color + '30');
            rGrad.addColorStop(1, r.color + '08');
            ctx.fillStyle = rGrad;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.fill();
            // Ring outline
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 1.5 * (1 - r.radius / r.maxRadius);
            ctx.stroke();
            ctx.restore();
        }

        this.renderParticleLayer(ctx, 'far');
        this.renderParticleLayer(ctx, 'mid');
        this.renderParticleLayer(ctx, 'near');
        this.renderSubtleGrid(ctx, w, h);
    }

    private renderParticleLayer(ctx: CanvasRenderingContext2D, layer: 'far' | 'mid' | 'near'): void {
        const colorKey = (layer + 'Particle') as keyof ColorScheme;
        const baseColor = this.currentScheme[colorKey] as string;
        for (const p of this.particles) {
            if (p.layer !== layer || p.alpha < 0.01) continue;
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = baseColor;
            if (layer === 'near') {
                ctx.shadowColor = baseColor;
                ctx.shadowBlur = p.size * 3;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    private renderSubtleGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 0.5;
        const spacing = 60;
        for (let y = spacing; y < h; y += spacing) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        for (let x = spacing; x < w; x += spacing) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        ctx.restore();
    }

    drawEnemyAura(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, radius: number,
        color: string, time: number,
        isActive: boolean = false,
        comboLevel: number = 0
    ): void {
        ctx.save();
        ctx.translate(x, y);
        const breathe = Math.sin(time * 0.003) * 0.1 + 1;
        const r = radius * breathe;
        const glowIntensity = isActive ? 0.25 : 0.1;
        const glowRadius = r * (isActive ? 2.5 : 1.8);
        const glowGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, glowRadius);
        glowGrad.addColorStop(0, this.hexToRgba(color, glowIntensity));
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        const orbitCount = isActive ? 4 + Math.min(4, comboLevel) : 2;
        const orbitRadius = r * 1.4;
        for (let i = 0; i < orbitCount; i++) {
            const angle = (Math.PI * 2 / orbitCount) * i + time * 0.002;
            const ox = Math.cos(angle) * orbitRadius;
            const oy = Math.sin(angle) * orbitRadius;
            const dotSize = 1 + (isActive ? 1 : 0);
            ctx.globalAlpha = 0.4 + Math.sin(time * 0.005 + i) * 0.2;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(ox, oy, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawTypingRipple(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, progress: number,
        color: string
    ): void {
        if (progress >= 1) return;
        ctx.save();
        const radius = progress * 60;
        const alpha = (1 - progress) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * (1 - progress);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    private blendSchemes(from: ColorScheme, to: ColorScheme, t: number): ColorScheme {
        return {
            bgTop: this.lerpColor(from.bgTop, to.bgTop, t),
            bgBottom: this.lerpColor(from.bgBottom, to.bgBottom, t),
            farParticle: t < 0.5 ? from.farParticle : to.farParticle,
            midParticle: t < 0.5 ? from.midParticle : to.midParticle,
            nearParticle: t < 0.5 ? from.nearParticle : to.nearParticle,
            auraCenter: this.lerpColor(from.auraCenter, to.auraCenter, t),
            auraEdge: t < 0.5 ? from.auraEdge : to.auraEdge,
        };
    }

    private lerpColor(from: string, to: string, t: number): string {
        const f = this.parseColor(from);
        const tt = this.parseColor(to);
        if (!f || !tt) return t < 0.5 ? from : to;
        const r = Math.round(f[0] + (tt[0] - f[0]) * t);
        const g = Math.round(f[1] + (tt[1] - f[1]) * t);
        const b = Math.round(f[2] + (tt[2] - f[2]) * t);
        const a = f[3] + (tt[3] - f[3]) * t;
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a.toFixed(3) + ')';
    }

    private parseColor(hex: string): [number, number, number, number] | null {
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b, 1];
        }
        const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m) return [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1];
        return null;
    }

    private hexToRgba(hex: string, alpha: number): string {
        const c = this.parseColor(hex);
        if (!c) return 'rgba(255,255,255,' + alpha + ')';
        return 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + alpha + ')';
    }

    private easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    getParticleCount(): number { return this.particles.length; }

    getDepthFactor(y: number, canvasHeight: number): number {
        const normalizedY = y / canvasHeight;
        return 0.7 + normalizedY * 0.5;
    }

    getDepthAlpha(y: number, canvasHeight: number): number {
        const normalizedY = y / canvasHeight;
        return 0.6 + normalizedY * 0.4;
    }

    getDepthBlur(y: number, canvasHeight: number): number {
        const normalizedY = y / canvasHeight;
        return (1 - normalizedY) * 2;
    }
}