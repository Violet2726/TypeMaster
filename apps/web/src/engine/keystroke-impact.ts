/**
 * Keystroke Impact - Visual feedback for every key press.
 *
 * Apple philosophy: every interaction should have a visible consequence.
 * The player's fingers are the controller; their rhythm drives the visuals.
 *
 * Three impact types:
 * 1. Correct Ring - blue/green expanding ring on active enemy
 * 2. Error Shake - enemy vibrates + red flash on wrong key
 * 3. Combo Milestone - screen-wide celebration at 5/10/15/20/25/30
 */

import { COLORS } from '../components/game/colors';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface ImpactRing {
    x: number;
    y: number;
    startTime: number;
    color: string;
    maxRadius: number;
}

interface ErrorShake {
    enemyId: string;
    startTime: number;
    duration: number;
}

interface ComboMilestone {
    level: number;
    startTime: number;
    duration: number;
}

const rings: ImpactRing[] = [];
const shakes: Map<string, ErrorShake> = new Map();
const milestones: ComboMilestone[] = [];

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

export function onCorrectKey(x: number, y: number, combo: number): void {
    // Ring color shifts with combo
    const color = combo >= 10 ? '#ffd700' : combo >= 5 ? '#32d74b' : '#0a84ff';
    const radius = 20 + Math.min(combo, 20) * 1.5;

    rings.push({
        x, y,
        startTime: performance.now(),
        color,
        maxRadius: radius,
    });

    // Keep bounded
    if (rings.length > 15) rings.shift();
}

export function onWrongKey(enemyId: string): void {
    shakes.set(enemyId, {
        enemyId,
        startTime: performance.now(),
        duration: 400,
    });
}

export function onComboMilestone(combo: number): void {
    // Only trigger at specific milestones
    const milestones_list = [5, 10, 15, 20, 25, 30];
    if (!milestones_list.includes(combo)) return;

    milestones.push({
        level: combo,
        startTime: performance.now(),
        duration: 800,
    });

    if (milestones.length > 3) milestones.shift();
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function updateKeystrokeImpact(): void {
    const now = performance.now();

    // Decay rings
    for (let i = rings.length - 1; i >= 0; i--) {
        if (now - rings[i].startTime > 500) rings.splice(i, 1);
    }

    // Decay shakes
    for (const [id, shake] of shakes) {
        if (now - shake.startTime > shake.duration) shakes.delete(id);
    }

    // Decay milestones
    for (let i = milestones.length - 1; i >= 0; i--) {
        if (now - milestones[i].startTime > milestones[i].duration) milestones.splice(i, 1);
    }
}

// ---------------------------------------------------------------------------
// Render: Impact Rings
// ---------------------------------------------------------------------------

export function renderImpactRings(ctx: CanvasRenderingContext2D, time: number): void {
    const now = time;

    for (const ring of rings) {
        const elapsed = (now - ring.startTime) / 500; // 0-1
        if (elapsed >= 1) continue;

        const t = easeOutCubic(elapsed);
        const radius = ring.maxRadius * t;
        const alpha = (1 - elapsed) * 0.5;

        ctx.save();
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2 * (1 - elapsed);
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill pulse
        ctx.fillStyle = ring.color;
        ctx.globalAlpha = alpha * 0.15;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Render: Error Shake (applied to enemy transform)
// ---------------------------------------------------------------------------

export function getEnemyShakeOffset(enemyId: string, time: number): { x: number; y: number } {
    const shake = shakes.get(enemyId);
    if (!shake) return { x: 0, y: 0 };

    const elapsed = time - shake.startTime;
    const progress = elapsed / shake.duration;
    if (progress >= 1) { shakes.delete(enemyId); return { x: 0, y: 0 }; }

    const intensity = (1 - progress) * 4;
    const freq = 30; // high frequency shake
    const x = Math.sin(elapsed * 0.001 * freq) * intensity;
    const y = Math.cos(elapsed * 0.001 * freq * 1.3) * intensity * 0.5;

    return { x, y };
}

export function getEnemyErrorFlash(enemyId: string, time: number): number {
    const shake = shakes.get(enemyId);
    if (!shake) return 0;

    const elapsed = time - shake.startTime;
    const progress = elapsed / shake.duration;
    if (progress >= 1) return 0;

    return (1 - progress) * 0.6; // red flash alpha
}

// ---------------------------------------------------------------------------
// Render: Combo Milestone Celebration
// ---------------------------------------------------------------------------

export function renderComboMilestones(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    for (const ms of milestones) {
        const elapsed = (time - ms.startTime) / ms.duration;
        if (elapsed >= 1) continue;

        const t = easeOutCubic(elapsed);
        const alpha = elapsed < 0.7 ? 1 : 1 - (elapsed - 0.7) / 0.3;

        // Screen-wide radial burst
        const burstRadius = Math.max(w, h) * t;
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, burstRadius);

        // Color based on milestone level
        const color = ms.level >= 20 ? '#ffd700' : ms.level >= 15 ? '#ff453a' : ms.level >= 10 ? '#bf5af2' : '#32d74b';

        grad.addColorStop(0, color + Math.round(alpha * 40).toString(16).padStart(2, '0'));
        grad.addColorStop(0.3, color + Math.round(alpha * 20).toString(16).padStart(2, '0'));
        grad.addColorStop(1, color + '00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Milestone text
        if (elapsed < 0.6) {
            const textScale = 0.5 + t * 0.5;
            const textAlpha = alpha;
            ctx.save();
            ctx.translate(w / 2, h / 2 - 30);
            ctx.scale(textScale, textScale);
            ctx.globalAlpha = textAlpha;

            // Number
            ctx.font = '800 48px -apple-system, SF Pro Display, system-ui, sans-serif';
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(ms.level), 0, 0);
            ctx.shadowBlur = 0;

            // Label
            ctx.font = '600 14px -apple-system, SF Pro Text, system-ui, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText('COMBO!', 0, 30);

            ctx.restore();
        }

        // Ring explosion
        for (let r = 0; r < 3; r++) {
            const ringT = Math.max(0, t - r * 0.1);
            const ringR = Math.max(w, h) * 0.5 * ringT;
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - ringT) * 0.3;
            ctx.lineWidth = 2 * (1 - ringT);
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, ringR, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}
