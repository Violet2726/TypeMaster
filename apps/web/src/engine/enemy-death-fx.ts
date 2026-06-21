/**
 * Enemy Death FX - Per-type death animations for visceral kill feedback.
 *
 * Apple philosophy: each death should feel earned and distinct.
 * The animation type matches the enemy's personality:
 *   Normal  - Clean dissolve ring + particle burst
 *   Fast    - Quick flash-shatter (sharp shards fly outward)
 *   Tank    - Heavy explosion + screen rumble particles
 *   Boss    - Dramatic implosion ring + energy pillar
 *
 * All effects are canvas-only (no DOM) and self-cleaning.
 */

import { COLORS } from '../components/game/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeathEffect {
    type: string;           // enemy type
    x: number;
    y: number;
    startTime: number;
    duration: number;
    color: string;
    size: number;
    phase: number;          // 0-1 animation progress
}

const effects: DeathEffect[] = [];

// ---------------------------------------------------------------------------
// Spawn
// ---------------------------------------------------------------------------

export function spawnDeathEffect(
    enemyType: string,
    x: number,
    y: number,
    color: string,
    size: number,
): void {
    const durations: Record<string, number> = {
        normal: 500,
        fast: 350,
        tank: 700,
        boss: 900,
    };

    effects.push({
        type: enemyType,
        x, y,
        startTime: performance.now(),
        duration: durations[enemyType] || 500,
        color,
        size,
        phase: 0,
    });

    // Keep pool bounded
    if (effects.length > 20) effects.splice(0, effects.length - 20);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function updateDeathEffects(): void {
    const now = performance.now();
    for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        e.phase = Math.min(1, (now - e.startTime) / e.duration);
        if (e.phase >= 1) effects.splice(i, 1);
    }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function renderDeathEffects(ctx: CanvasRenderingContext2D, time: number): void {
    for (const e of effects) {
        switch (e.type) {
            case 'fast': renderFastDeath(ctx, e, time); break;
            case 'tank': renderTankDeath(ctx, e, time); break;
            case 'boss': renderBossDeath(ctx, e, time); break;
            default: renderNormalDeath(ctx, e, time); break;
        }
    }
}

// ---------------------------------------------------------------------------
// Normal death: expanding ring + clean dissolve
// ---------------------------------------------------------------------------

function renderNormalDeath(ctx: CanvasRenderingContext2D, e: DeathEffect, time: number): void {
    const t = e.phase;
    const alpha = 1 - easeOutCubic(t);

    ctx.save();
    ctx.translate(e.x, e.y);

    // Expanding ring
    const ringRadius = e.size * (1 + t * 2.5);
    const ringAlpha = alpha * 0.6;
    ctx.strokeStyle = e.color;
    ctx.globalAlpha = ringAlpha;
    ctx.lineWidth = 2 * (1 - t);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner flash (brief)
    if (t < 0.2) {
        const flashAlpha = (1 - t / 0.2) * 0.4;
        const flashRadius = e.size * (1 + t * 3);
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, flashRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Dissolve particles (small dots scatter outward)
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + t * 0.5;
        const dist = e.size * (0.5 + t * 2);
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        const dotAlpha = alpha * 0.7;
        const dotSize = 2 * (1 - t);

        ctx.globalAlpha = dotAlpha;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Fast death: sharp flash-shatter (shards fly outward)
// ---------------------------------------------------------------------------

function renderFastDeath(ctx: CanvasRenderingContext2D, e: DeathEffect, time: number): void {
    const t = e.phase;
    const alpha = 1 - easeOutCubic(t);

    ctx.save();
    ctx.translate(e.x, e.y);

    // Central flash
    if (t < 0.15) {
        const flashAlpha = (1 - t / 0.15) * 0.7;
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Diamond shards fly outward
    const shardCount = 6;
    for (let i = 0; i < shardCount; i++) {
        const angle = (Math.PI * 2 / shardCount) * i + 0.3;
        const dist = e.size * (0.3 + t * 3);
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        const rotation = t * Math.PI * 2 + i;
        const shardSize = e.size * 0.3 * (1 - t * 0.5);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rotation);
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = e.color;

        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -shardSize);
        ctx.lineTo(shardSize * 0.5, 0);
        ctx.lineTo(0, shardSize);
        ctx.lineTo(-shardSize * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Motion blur line (brief)
    if (t < 0.3) {
        ctx.globalAlpha = (1 - t / 0.3) * 0.3;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const len = e.size * (0.5 + t * 2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * e.size * 0.3, Math.sin(angle) * e.size * 0.3);
            ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            ctx.stroke();
        }
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Tank death: heavy explosion + debris chunks
// ---------------------------------------------------------------------------

function renderTankDeath(ctx: CanvasRenderingContext2D, e: DeathEffect, time: number): void {
    const t = e.phase;
    const alpha = 1 - easeOutCubic(t);

    ctx.save();
    ctx.translate(e.x, e.y);

    // Heavy flash ring
    if (t < 0.25) {
        const flashT = t / 0.25;
        const ringR = e.size * (1 + flashT * 2);
        const flashAlpha = (1 - flashT) * 0.5;
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.fill();
    }

    // Outer shockwave ring
    const shockR = e.size * (0.5 + t * 3.5);
    ctx.globalAlpha = alpha * 0.4;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3 * (1 - t);
    ctx.beginPath();
    ctx.arc(0, 0, shockR, 0, Math.PI * 2);
    ctx.stroke();

    // Second smaller shockwave (delayed)
    if (t > 0.1) {
        const t2 = t - 0.1;
        const shock2R = e.size * (0.3 + t2 * 3);
        ctx.globalAlpha = (1 - t2 / 0.9) * 0.25;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * (1 - t2);
        ctx.beginPath();
        ctx.arc(0, 0, shock2R, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Hexagonal debris chunks
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + 0.5;
        const speed = 1.5 + (i % 3) * 0.5;
        const dist = e.size * (0.2 + t * speed * 2);
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist - t * 15; // gravity effect
        const chunkSize = e.size * 0.2 * (1 - t * 0.7);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t * 3 + i);
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = e.color;

        // Hexagon chunk
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const a = (Math.PI * 2 / 6) * j;
            const r = chunkSize * (j % 2 === 0 ? 1 : 0.8);
            if (j === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Center dark implosion (brief)
    if (t > 0.1 && t < 0.4) {
        const impT = (t - 0.1) / 0.3;
        ctx.globalAlpha = impT * 0.5 * (1 - impT);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.5 * (1 - impT), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Boss death: dramatic implosion ring + energy pillar
// ---------------------------------------------------------------------------

function renderBossDeath(ctx: CanvasRenderingContext2D, e: DeathEffect, time: number): void {
    const t = e.phase;
    const alpha = 1 - easeOutCubic(t);

    ctx.save();
    ctx.translate(e.x, e.y);

    // Phase 1: Implosion (t 0-0.4) - everything rushes inward
    if (t < 0.4) {
        const impT = t / 0.4;

        // Converging ring particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const startDist = e.size * 3;
            const dist = startDist * (1 - easeOutCubic(impT));
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            const particleSize = 3 * (1 - impT * 0.5);

            ctx.globalAlpha = (1 - impT) * 0.8;
            ctx.fillStyle = i % 2 === 0 ? e.color : '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central dark spot growing
        ctx.globalAlpha = impT * 0.6;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.8 * impT, 0, Math.PI * 2);
        ctx.fill();
    }

    // Phase 2: Explosion (t 0.4-1.0) - energy pillar + rings
    if (t >= 0.4) {
        const expT = (t - 0.4) / 0.6;

        // Energy pillar (vertical beam)
        const pillarHeight = e.size * 5 * easeOutCubic(expT);
        const pillarWidth = e.size * 0.4 * (1 - expT * 0.5);
        ctx.globalAlpha = (1 - expT) * 0.7;

        // Pillar gradient
        const pillarGrad = ctx.createLinearGradient(0, pillarHeight, 0, -pillarHeight);
        pillarGrad.addColorStop(0, 'rgba(0,0,0,0)');
        pillarGrad.addColorStop(0.3, e.color);
        pillarGrad.addColorStop(0.5, '#ffffff');
        pillarGrad.addColorStop(0.7, e.color);
        pillarGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pillarGrad;
        ctx.fillRect(-pillarWidth, -pillarHeight, pillarWidth * 2, pillarHeight * 2);

        // Expanding rings
        for (let r = 0; r < 3; r++) {
            const ringDelay = r * 0.08;
            const ringT = Math.max(0, expT - ringDelay);
            const ringR = e.size * (1 + ringT * 4);
            ctx.globalAlpha = (1 - ringT) * 0.3;
            ctx.strokeStyle = r === 0 ? e.color : r === 1 ? '#ffffff' : e.color;
            ctx.lineWidth = 2 * (1 - ringT);
            ctx.beginPath();
            ctx.arc(0, 0, ringR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Scattered debris
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + expT * 0.5;
            const dist = e.size * (0.5 + expT * 3);
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;

            ctx.globalAlpha = (1 - expT) * 0.6;
            ctx.fillStyle = e.color;
            ctx.beginPath();
            // Star-shaped debris
            for (let p = 0; p < 5; p++) {
                const pa = (Math.PI * 2 / 5) * p + expT * 2;
                const pr = e.size * 0.15 * (p % 2 === 0 ? 1 : 0.5);
                if (p === 0) ctx.moveTo(px + Math.cos(pa) * pr, py + Math.sin(pa) * pr);
                else ctx.lineTo(px + Math.cos(pa) * pr, py + Math.sin(pa) * pr);
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}
