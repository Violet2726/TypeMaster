/**
 * Achievement Tracker - Progress tracking during gameplay.
 *
 * Shows a small progress indicator in the HUD for the nearest achievement.
 * Tracks: combo, waves, kills, WPM, power-ups collected.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";

interface AchievementProgress {
    id: string;
    title: string;
    icon: string;
    color: string;
    current: number;
    target: number;
    unit: string;
}

const TRACKED_ACHIEVEMENTS: Omit<AchievementProgress, "current">[] = [
    { id: "combo-20", title: "Combo Master", icon: "火", color: "#ff453a", target: 20, unit: "combo" },
    { id: "first-wave", title: "First Wave", icon: "星", color: "#0a84ff", target: 1, unit: "wave" },
    { id: "perfect-wave", title: "Perfectionist", icon: "完", color: "#ffd60a", target: 1, unit: "perfect" },
    { id: "speed-demon", title: "Speed Demon", icon: "速", color: "#32d74b", target: 80, unit: "wpm" },
    { id: "chain-5", title: "Chain Reaction", icon: "链", color: "#bf5af2", target: 5, unit: "chain" },
    { id: "survivor", title: "Survivor", icon: "存", color: "#32d74b", target: 10, unit: "wave" },
    { id: "legend", title: "Legend", icon: "传", color: "#ffd700", target: 10000, unit: "score" },
];

let progress: AchievementProgress[] = [];
let bestChain = 0;
let powerUpsCollected = 0;

export function resetTracker(): void {
    progress = TRACKED_ACHIEVEMENTS.map(a => ({ ...a, current: 0 }));
    bestChain = 0;
    powerUpsCollected = 0;
}

export function updateTracker(stats: {
    combo: number; wave: number; wpm: number; score: number;
    chain: number; perfectWaves: number;
}): void {
    bestChain = Math.max(bestChain, stats.chain);

    progress.forEach(p => {
        switch (p.unit) {
            case "combo": p.current = stats.combo; break;
            case "wave": p.current = stats.wave; break;
            case "perfect": p.current = stats.perfectWaves; break;
            case "wpm": p.current = stats.wpm; break;
            case "chain": p.current = bestChain; break;
            case "score": p.current = stats.score; break;
        }
    });
}

export function trackPowerUp(): void { powerUpsCollected++; }

// Get the closest-to-completion achievement (for HUD display)
export function getNearestAchievement(): AchievementProgress | null {
    const incomplete = progress.filter(p => p.current < p.target);
    if (incomplete.length === 0) return null;
    // Sort by completion percentage (highest first)
    incomplete.sort((a, b) => (b.current / b.target) - (a.current / a.target));
    return incomplete[0];
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function drawAchievementTracker(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const nearest = getNearestAchievement();
    if (!nearest) return;

    const pct = nearest.current / nearest.target;
    if (pct < 0.1) return; // Don't show if less than 10%

    const trackerW = Math.min(160, w * 0.2);
    const trackerH = 28;
    const trackerX = w - trackerW - 16;
    const trackerY = h - trackerH - 16;

    ctx.save();

    // Background
    ctx.globalAlpha = 0.7;
    drawGlassPanel(ctx, trackerX, trackerY, trackerW, trackerH, 8);
    ctx.globalAlpha = 1;

    // Progress bar
    const barX = trackerX + 4;
    const barY = trackerY + 4;
    const barW = trackerW - 8;
    const barH = trackerH - 8;

    ctx.fillStyle = nearest.color + "30";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * pct, barH, 6);
    ctx.fill();

    // Icon + text
    ctx.font = "600 10px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = nearest.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(nearest.icon, trackerX + 10, trackerY + trackerH / 2);

    ctx.font = "500 9px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textSecondary;
    ctx.textAlign = "right";
    ctx.fillText(nearest.current + "/" + nearest.target, trackerX + trackerW - 8, trackerY + trackerH / 2);

    ctx.restore();
}