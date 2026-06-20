/**
 * Achievement Modal - Apple-style full-screen celebration.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    rarity: "common" | "rare" | "epic" | "legendary";
}

const ACHIEVEMENT_DB: Record<string, Achievement> = {
    "combo-20": { id: "combo-20", title: "Combo Master", description: "Reach a 20-hit combo", icon: "火", color: "#ff453a", rarity: "epic" },
    "first-wave": { id: "first-wave", title: "First Wave", description: "Complete your first wave", icon: "星", color: "#0a84ff", rarity: "common" },
    "perfect-wave": { id: "perfect-wave", title: "Perfectionist", description: "Complete a wave without leaks", icon: "完", color: "#ffd60a", rarity: "rare" },
    "speed-demon": { id: "speed-demon", title: "Speed Demon", description: "Type at 80+ WPM", icon: "速", color: "#32d74b", rarity: "rare" },
    "chain-5": { id: "chain-5", title: "Chain Reaction", description: "5-chain kill streak", icon: "链", color: "#bf5af2", rarity: "rare" },
    "boss-killer": { id: "boss-killer", title: "Boss Slayer", description: "Defeat a boss enemy", icon: "杀", color: "#ff9f0a", rarity: "common" },
    "power-collector": { id: "power-collector", title: "Power Hungry", description: "Collect 5 power-ups in one game", icon: "能", color: "#0a84ff", rarity: "rare" },
    "survivor": { id: "survivor", title: "Survivor", description: "Reach wave 10", icon: "存", color: "#32d74b", rarity: "epic" },
    "legend": { id: "legend", title: "Legend", description: "Score 10000 points", icon: "传", color: "#ffd700", rarity: "legendary" },
};

const RARITY_COLORS: Record<string, { border: string; glow: string }> = {
    common:    { border: "rgba(255,255,255,0.15)", glow: "rgba(255,255,255,0.2)" },
    rare:      { border: "rgba(10,132,255,0.4)", glow: "rgba(10,132,255,0.3)" },
    epic:      { border: "rgba(191,90,242,0.4)", glow: "rgba(191,90,242,0.3)" },
    legendary: { border: "rgba(255,215,0,0.5)", glow: "rgba(255,215,0,0.4)" },
};

interface ModalState {
    achievement: Achievement;
    startTime: number;
}

let queue: ModalState[] = [];
let current: ModalState | null = null;
const DISPLAY_DURATION = 3.5;

export function getAchievement(id: string): Achievement | null {
    return ACHIEVEMENT_DB[id] || null;
}

export function enqueueAchievement(id: string): void {
    const ach = ACHIEVEMENT_DB[id];
    if (!ach) return;
    if (current && current.achievement.id === id) return;
    if (queue.some(q => q.achievement.id === id)) return;
    queue.push({ achievement: ach, startTime: 0 });
}

export function updateAchievementModal(time: number): void {
    if (!current && queue.length > 0) {
        current = queue.shift()!;
        current.startTime = time;
    }
    if (current) {
        const elapsed = (time - current.startTime) / 1000;
        if (elapsed > DISPLAY_DURATION) current = null;
    }
}

export function clearAchievementQueue(): void {
    queue = [];
    current = null;
}

function easeOutBack(t: number): number {
    const c1 = 1.70158; const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function renderAchievementModal(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): boolean {
    if (!current) return false;
    const elapsed = (time - current.startTime) / 1000;
    const ach = current.achievement;
    const rarity = RARITY_COLORS[ach.rarity];

    const fadeOut = elapsed > DISPLAY_DURATION - 0.5 ? (DISPLAY_DURATION - elapsed) / 0.5 : 1;
    const overallAlpha = fadeOut;

    ctx.save();
    ctx.globalAlpha = overallAlpha;

    // Backdrop
    const backdropAlpha = Math.min(0.6, elapsed / 0.4 * 0.6);
    ctx.fillStyle = "rgba(0,0,0," + backdropAlpha + ")";
    ctx.fillRect(0, 0, w, h);

    // Modal panel
    const panelW = 320; const panelH = 280;
    const panelX = w / 2 - panelW / 2; const panelY = h / 2 - panelH / 2;
    const panelProgress = Math.max(0, Math.min(1, (elapsed - 0.2) / 0.4));
    const panelScale = easeOutBack(panelProgress);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(panelScale, panelScale);
    ctx.translate(-w / 2, -h / 2);

    drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 24);
    ctx.strokeStyle = rarity.border; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, panelH, 24); ctx.stroke();

    // ACHIEVEMENT UNLOCKED label
    const labelProgress = Math.max(0, Math.min(1, (elapsed - 0.4) / 0.3));
    ctx.globalAlpha = labelProgress;
    ctx.font = "600 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = ach.color; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("ACHIEVEMENT UNLOCKED", w / 2, panelY + 24);
    ctx.globalAlpha = overallAlpha;

    // Icon with glow
    const iconProgress = Math.max(0, Math.min(1, (elapsed - 0.5) / 0.4));
    const iconScale = easeOutBack(iconProgress);
    const iconY = panelY + 90;

    ctx.save(); ctx.translate(w / 2, iconY); ctx.scale(iconScale, iconScale);

    const glowPulse = Math.sin(time * 0.005) * 0.3 + 0.7;
    const glowGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 60);
    glowGrad.addColorStop(0, rarity.glow); glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad; ctx.globalAlpha = glowPulse * iconProgress;
    ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = overallAlpha;

    const iconGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 32);
    iconGrad.addColorStop(0, "#ffffff"); iconGrad.addColorStop(0.3, ach.color); iconGrad.addColorStop(1, ach.color + "80");
    ctx.fillStyle = iconGrad; ctx.shadowColor = ach.color; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

    ctx.font = "bold 28px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ach.icon, 0, 0);
    ctx.restore();

    // Title
    const titleProgress = Math.max(0, Math.min(1, (elapsed - 0.7) / 0.3));
    ctx.globalAlpha = titleProgress * overallAlpha;
    ctx.font = "700 22px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ach.title, w / 2, panelY + 170);

    // Description
    const descProgress = Math.max(0, Math.min(1, (elapsed - 0.9) / 0.3));
    ctx.globalAlpha = descProgress * overallAlpha;
    ctx.font = "400 14px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textSecondary; ctx.textAlign = "center";
    ctx.fillText(ach.description, w / 2, panelY + 200);

    // Rarity badge
    const rarityProgress = Math.max(0, Math.min(1, (elapsed - 1.1) / 0.3));
    ctx.globalAlpha = rarityProgress * overallAlpha;
    const badgeW = 80; const badgeH = 22;
    const badgeX = w / 2 - badgeW / 2; const badgeY = panelY + 225;
    ctx.fillStyle = ach.color + "30";
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 11); ctx.fill();
    ctx.strokeStyle = ach.color + "60"; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = "600 10px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = ach.color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ach.rarity.toUpperCase(), w / 2, badgeY + 11);

    ctx.restore(); ctx.restore();
    return true;
}