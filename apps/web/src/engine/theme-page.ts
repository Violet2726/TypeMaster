/**
 * Theme Selection Page - Preview and switch visual themes.
 *
 * Shows all themes with preview colors and unlock status.
 * Accessible from idle screen (press T) or settings.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";
import {
    VISUAL_THEMES, getActiveTheme, setActiveTheme,
    getUnlockedThemes, isThemeUnlocked,
} from "@typemaster/domain";
import { playMenuNavigate, playMenuSelect, playMenuBack } from "../components/game/sound-engine";

function getScale(w, h) { return Math.max(0.6, Math.min(1.2, w / 800)); }

const themeIds = Object.keys(VISUAL_THEMES);
let isOpen = false;
let selectedIndex = 0;

export function openThemePage() {
    isOpen = true;
    const active = getActiveTheme();
    selectedIndex = themeIds.indexOf(active.id);
    if (selectedIndex < 0) selectedIndex = 0;
}

export function closeThemePage() { isOpen = false; }
export function isThemePageOpen() { return isOpen; }

export function handleThemePageKey(e) {
    if (!isOpen) return;

    if (e.key === 'Escape' || e.key === 't' || e.key === 'T') {
        closeThemePage();
        playMenuBack();
        return;
    }

    if (e.key === 'ArrowUp' || e.key === 'w') {
        selectedIndex = Math.max(0, selectedIndex - 1);
        playMenuNavigate();
        return;
    }

    if (e.key === 'ArrowDown' || e.key === 's') {
        selectedIndex = Math.min(themeIds.length - 1, selectedIndex + 1);
        playMenuNavigate();
        return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
        const themeId = themeIds[selectedIndex];
        if (isThemeUnlocked(themeId)) {
            setActiveTheme(themeId);
            playMenuSelect();
        }
        return;
    }
}

export function renderThemePage(ctx, w, h, time) {
    if (!isOpen) return;

    const s = getScale(w, h);
    const activeTheme = getActiveTheme();

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.font = '700 ' + Math.round(24 * s) + 'px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Visual Themes', w / 2, 30);

    // Theme list
    const listY = 75;
    const cardW = Math.min(400, w - 40);
    const cardH = 65;
    const cardGap = 10;

    themeIds.forEach((id, i) => {
        const theme = VISUAL_THEMES[id];
        const isActive = activeTheme.id === id;
        const isUnlocked = isThemeUnlocked(id);
        const isSelected = i === selectedIndex;
        const cy = listY + i * (cardH + cardGap);
        const cx = w / 2 - cardW / 2;

        // Card background
        drawGlassPanel(ctx, cx, cy, cardW, cardH, 10);

        // Selection highlight
        if (isSelected) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx - 1, cy - 1, cardW + 2, cardH + 2, 11);
            ctx.stroke();
        }

        // Color preview swatches
        const swatchSize = 12;
        const swatchY = cy + 12;
        const swatchColors = isUnlocked
            ? [theme.colors.normal, theme.colors.fast, theme.colors.tank, theme.colors.boss]
            : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'];

        swatchColors.forEach((color, j) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(cx + 12 + j * (swatchSize + 4), swatchY, swatchSize, swatchSize, 3);
            ctx.fill();
        });

        // Theme name
        ctx.font = '600 ' + Math.round(13 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
        ctx.fillStyle = isUnlocked ? COLORS.text : COLORS.textTertiary;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(theme.nameZh + ' ' + theme.name, cx + 12, swatchY + 18);

        // Description
        ctx.font = '400 ' + Math.round(10 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
        ctx.fillStyle = isUnlocked ? COLORS.textSecondary : COLORS.textMuted;
        ctx.fillText(isUnlocked ? theme.desc : 'LOCKED - ' + theme.desc, cx + 12, swatchY + 36);

        // Status badge
        if (isActive) {
            ctx.font = '700 ' + Math.round(10 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
            ctx.fillStyle = '#34c759';
            ctx.textAlign = 'right';
            ctx.fillText('ACTIVE', cx + cardW - 12, cy + 12);
        } else if (!isUnlocked) {
            ctx.font = '500 ' + Math.round(10 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
            ctx.fillStyle = COLORS.textMuted;
            ctx.textAlign = 'right';
            ctx.fillText('LOCKED', cx + cardW - 12, cy + 12);
        }
    });

    // Navigation hint
    ctx.font = '400 ' + Math.round(10 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('���� select  |  Enter apply  |  T/Esc close', w / 2, h - 15);
}
