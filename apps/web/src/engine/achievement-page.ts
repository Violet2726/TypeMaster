/**
 * Achievement Page - Display all achievements with unlock status.
 *
 * Shows achievements grouped by category with progress indicators.
 * Accessible from idle screen (press A) or pause menu.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";
import {
    ACHIEVEMENTS, getAchievementsByCategory,
    loadAchievementState, getUnlockedCount, getTotalCount,
} from "@typemaster/domain";
import { playMenuNavigate, playMenuSelect, playMenuBack } from "../components/game/sound-engine";

function getScale(w: number, h: number): number { return Math.max(0.6, Math.min(1.2, w / 800)); }

const CATEGORY_LABELS: Record<string, string> = {
    combat: 'Combat',
    combo: 'Combo',
    wave: 'Wave',
    boss: 'Boss',
    daily: 'Daily',
    progression: 'Progression',
    special: 'Special',
};

const CATEGORY_LABELS_ZH: Record<string, string> = {
    combat: 'ս��',
    combo: '����',
    wave: '����',
    boss: 'Boss',
    daily: 'ÿ��',
    progression: '�ɳ�',
    special: '����',
};

let isOpen = false;
let scrollY = 0;
let selectedCategory = 0;
const categories = Object.keys(CATEGORY_LABELS);

export function openAchievementPage(): void {
    isOpen = true;
    scrollY = 0;
    selectedCategory = 0;
}

export function closeAchievementPage(): void {
    isOpen = false;
}

export function isAchievementPageOpen(): boolean {
    return isOpen;
}

export function handleAchievementPageKey(e: KeyboardEvent): void {
    if (!isOpen) return;

    if (e.key === 'Escape' || e.key === 'a' || e.key === 'A') {
        closeAchievementPage();
        playMenuBack();
        return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'h') {
        selectedCategory = Math.max(0, selectedCategory - 1);
        scrollY = 0;
        playMenuNavigate();
        return;
    }

    if (e.key === 'ArrowRight' || e.key === 'l') {
        selectedCategory = Math.min(categories.length - 1, selectedCategory + 1);
        scrollY = 0;
        playMenuNavigate();
        return;
    }

    if (e.key === 'ArrowUp') {
        scrollY = Math.max(0, scrollY - 60);
        playMenuNavigate();
        return;
    }

    if (e.key === 'ArrowDown') {
        scrollY += 60;
        playMenuNavigate();
        return;
    }
}

export function renderAchievementPage(
    ctx: CanvasRenderingContext2D,
    w: number, h: number, time: number,
): void {
    if (!isOpen) return;

    const s = getScale(w, h);
    const achievementState = loadAchievementState();
    const unlocked = getUnlockedCount();
    const total = getTotalCount();

    // Overlay
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.font = "700 " + Math.round(24 * s) + "px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Achievements", w / 2, 30);

    // Progress counter
    ctx.font = "500 " + Math.round(12 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textSecondary;
    ctx.fillText(unlocked + " / " + total + " unlocked", w / 2, 60);

    // Progress bar
    const barW = 200 * s;
    const barH = 4;
    const barX = w / 2 - barW / 2;
    const barY = 80;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.fill();
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * (unlocked / total), barH, 2);
    ctx.fill();

    // Category tabs
    const tabY = 100;
    const tabW = 80;
    const totalTabW = categories.length * tabW;
    const tabStartX = w / 2 - totalTabW / 2;

    categories.forEach((cat, i) => {
        const tx = tabStartX + i * tabW;
        const isActive = i === selectedCategory;

        ctx.font = (isActive ? "700 " : "500 ") + Math.round(10 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = isActive ? COLORS.text : COLORS.textTertiary;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(CATEGORY_LABELS_ZH[cat] || cat, tx + tabW / 2, tabY);

        // Active indicator
        if (isActive) {
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(tx + tabW / 2 - 12, tabY + 16, 24, 2);
        }
    });

    // Achievement list
    const cat = categories[selectedCategory];
    const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
    const listStartY = 130;
    const cardW = Math.min(400, w - 60);
    const cardH = 50;
    const cardGap = 8;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, listStartY, w, h - listStartY - 40);
    ctx.clip();

    catAchievements.forEach((ach, i) => {
        const cy = listStartY + i * (cardH + cardGap) - scrollY;
        if (cy < listStartY - cardH || cy > h) return; // Skip off-screen

        const isUnlocked = !!achievementState[ach.id]?.unlocked;
        const cx = w / 2 - cardW / 2;

        // Card background
        drawGlassPanel(ctx, cx, cy, cardW, cardH, 8);

        // Icon circle
        ctx.fillStyle = isUnlocked ? ach.color : "rgba(255,255,255,0.1)";
        ctx.beginPath();
        ctx.arc(cx + 25, cy + cardH / 2, 16, 0, Math.PI * 2);
        ctx.fill();

        // Icon text
        ctx.font = "700 " + Math.round(12 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = isUnlocked ? "#000000" : "rgba(255,255,255,0.3)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ach.icon, cx + 25, cy + cardH / 2);

        // Achievement name
        ctx.font = "600 " + Math.round(12 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = isUnlocked ? COLORS.text : COLORS.textSecondary;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(ach.nameZh, cx + 50, cy + 10);

        // Description
        ctx.font = "400 " + Math.round(10 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.fillText(ach.desc, cx + 50, cy + 28);

        // Unlock status
        if (isUnlocked) {
            ctx.font = "700 " + Math.round(10 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = "#34c759";
            ctx.textAlign = "right";
            ctx.fillText("UNLOCKED", cx + cardW - 10, cy + cardH / 2 - 6);
        } else {
            ctx.font = "500 " + Math.round(9 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = COLORS.textMuted;
            ctx.textAlign = "right";
            ctx.fillText("LOCKED", cx + cardW - 10, cy + cardH / 2 - 6);
        }

        // Reward badge
        if (ach.reward && isUnlocked) {
            ctx.font = "500 " + Math.round(8 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = "#ffd700";
            ctx.textAlign = "right";
            ctx.fillText(ach.reward, cx + cardW - 10, cy + cardH / 2 + 8);
        }
    });

    ctx.restore();

    // Navigation hint
    ctx.font = "400 " + Math.round(10 * s) + "px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("�� �� switch categories  |  �� �� scroll  |  A/Esc close", w / 2, h - 15);
}

