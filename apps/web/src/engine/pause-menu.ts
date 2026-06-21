/**
 * Pause Menu - Apple-style navigation menu with live stats.
 *
 * Two-tab interface:
 *   Menu    - Continue / Settings / Restart / Quit
 *   Stats   - Live game performance data
 *
 * Keyboard:
 *   Tab     - Switch between Menu / Stats
 *   Arrows  - Navigate
 *   Enter   - Select
 *   Esc     - Continue
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";
import { playMenuNavigate, playMenuSelect, playMenuBack } from "../components/game/sound-engine";

export type PauseAction = "continue" | "settings" | "restart" | "quit" | null;

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

interface MenuItem {
    label: string;
    labelZh: string;
    key: string;
    action: PauseAction;
    color: string;
}

const MENU_ITEMS: MenuItem[] = [
    { label: "Continue", labelZh: "继续", key: "Esc", action: "continue", color: "#32d74b" },
    { label: "Settings", labelZh: "设置", key: "S", action: "settings", color: "#0a84ff" },
    { label: "Restart", labelZh: "重新开始", key: "R", action: "restart", color: "#ff9f0a" },
    { label: "Quit", labelZh: "退出", key: "Q", action: "quit", color: "#ff453a" },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let selectedIndex = 0;
let activeTab: "menu" | "stats" = "menu";

// Live stats (injected from game engine)
let liveStats = {
    score: 0,
    wave: 0,
    combo: 0,
    maxCombo: 0,
    lives: 5,
    enemiesDefeated: 0,
    enemiesLeaked: 0,
    accuracy: 100,
    wpm: 0,
    duration: 0,
};

export function resetPauseMenu(): void {
    selectedIndex = 0;
    activeTab = "menu";
}

export function updateLiveStats(stats: Partial<typeof liveStats>): void {
    Object.assign(liveStats, stats);
}

export function handlePauseMenuKey(e: KeyboardEvent): PauseAction {
    // Tab to switch tabs
    if (e.key === "Tab") {
        activeTab = activeTab === "menu" ? "stats" : "menu";
        playMenuNavigate();
        return null;
    }

    if (activeTab === "stats") {
        // Stats tab: only Esc returns to menu/continues
        if (e.key === "Escape") { playMenuBack(); return "continue"; }
        return null;
    }

    // Menu tab navigation
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        playMenuNavigate();
        return null;
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        selectedIndex = Math.min(MENU_ITEMS.length - 1, selectedIndex + 1);
        playMenuNavigate();
        return null;
    }
    if (e.key === "Enter" || e.key === " ") {
        playMenuSelect();
        return MENU_ITEMS[selectedIndex].action;
    }
    // Direct shortcuts
    if (e.key === "Escape") { playMenuBack(); return "continue"; }
    if (e.key === "r" || e.key === "R") return "restart";
    if (e.key === "q" || e.key === "Q") return "quit";
    return null;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function renderPauseMenu(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const panelW = 380;
    const panelH = 420;
    const panelX = w / 2 - panelW / 2;
    const panelY = h / 2 - panelH / 2;

    ctx.save();

    // Glass panel with subtle breathing border
    drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 24);
    const breath = Math.sin(time * 0.002) * 0.02 + 0.12;
    ctx.strokeStyle = "rgba(255,255,255," + breath + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 24);
    ctx.stroke();

    // Title
    ctx.font = "700 26px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Paused", w / 2, panelY + 38);

    // --- Segmented Control (Menu | Stats) ---
    const segW = 200;
    const segH = 30;
    const segX = w / 2 - segW / 2;
    const segY = panelY + 60;

    // Segmented background
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.roundRect(segX, segY, segW, segH, 8);
    ctx.fill();

    // Active segment highlight
    const seg1W = segW / 2;
    const activeX = activeTab === "menu" ? segX : segX + seg1W;
    ctx.fillStyle = "rgba(10,132,255,0.2)";
    ctx.beginPath();
    ctx.roundRect(activeX, segY, seg1W, segH, 8);
    ctx.fill();

    // Tab labels
    ctx.font = "600 12px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = activeTab === "menu" ? "#ffffff" : COLORS.textTertiary;
    ctx.fillText("Menu", segX + seg1W / 2, segY + segH / 2);

    ctx.fillStyle = activeTab === "stats" ? "#ffffff" : COLORS.textTertiary;
    ctx.fillText("Stats", segX + seg1W + seg1W / 2, segY + segH / 2);

    // --- Content Area ---
    if (activeTab === "menu") {
        renderMenuTab(ctx, panelX, panelY, panelW, panelH, time);
    } else {
        renderStatsTab(ctx, panelX, panelY, panelW, panelH, time, panelX + panelW / 2);
    }

    // Footer hint
    ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Tab switch  |  Arrow keys navigate  |  Enter select", w / 2, panelY + panelH - 18);

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Menu Tab
// ---------------------------------------------------------------------------

function renderMenuTab(
    ctx: CanvasRenderingContext2D,
    panelX: number, panelY: number, panelW: number, panelH: number,
    time: number,
): void {
    const startY = panelY + 110;

    MENU_ITEMS.forEach((item, i) => {
        const y = startY + i * 60;
        const isSelected = i === selectedIndex;
        const pulse = isSelected ? Math.sin(time * 0.005) * 0.04 + 0.96 : 1;

        // Selection highlight
        if (isSelected) {
            ctx.fillStyle = item.color + "18";
            ctx.beginPath();
            ctx.roundRect(panelX + 24, y - 20, panelW - 48, 48, 14);
            ctx.fill();

            ctx.strokeStyle = item.color + "30";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(panelX + 24, y - 20, panelW - 48, 48, 14);
            ctx.stroke();

            // Left accent bar
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.roundRect(panelX + 24, y - 8, 3, 24, 1.5);
            ctx.fill();
        }

        ctx.globalAlpha = pulse;

        // Icon circle
        ctx.fillStyle = item.color + "25";
        ctx.beginPath();
        ctx.arc(panelX + 52, y + 4, 15, 0, Math.PI * 2);
        ctx.fill();

        // Icon letter
        ctx.font = "700 13px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = item.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label[0], panelX + 52, y + 4);

        // Label (English + Chinese)
        ctx.font = "500 15px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = isSelected ? COLORS.text : COLORS.textSecondary;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label, panelX + 78, y - 2);

        ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.fillText(item.labelZh, panelX + 78, y + 14);

        // Shortcut key pill
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.roundRect(panelX + panelW - 70, y - 8, 40, 22, 6);
        ctx.fill();

        ctx.font = "500 10px SF Mono, Cascadia Mono, monospace";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "center";
        ctx.fillText(item.key, panelX + panelW - 50, y + 4);

        ctx.globalAlpha = 1;
    });
}

// ---------------------------------------------------------------------------
// Stats Tab
// ---------------------------------------------------------------------------

function renderStatsTab(
    ctx: CanvasRenderingContext2D,
    panelX: number, panelY: number, panelW: number, panelH: number,
    time: number,
    cx?: number,
): void {
    const startY = panelY + 105;

    const stats = [
        { label: "SCORE", value: String(liveStats.score), color: "#ffd700", icon: "⭐" },
        { label: "WAVE", value: String(liveStats.wave), color: "#0a84ff", icon: "🌊" },
        { label: "COMBO", value: String(liveStats.combo) + " / " + String(liveStats.maxCombo), color: "#bf5af2", icon: "⚡" },
        { label: "LIVES", value: "❤".repeat(Math.max(0, Math.min(5, liveStats.lives))), color: "#ff453a", icon: "" },
        { label: "KILLS", value: String(liveStats.enemiesDefeated), color: "#32d74b", icon: "💥" },
        { label: "WPM", value: String(liveStats.wpm), color: "#ff9f0a", icon: "⏱" },
        { label: "ACCURACY", value: liveStats.accuracy + "%", color: liveStats.accuracy >= 90 ? "#32d74b" : liveStats.accuracy >= 70 ? "#ff9f0a" : "#ff453a", icon: "🎯" },
        { label: "LEAKED", value: String(liveStats.enemiesLeaked), color: COLORS.textTertiary, icon: "🚫" },
    ];

    // Two-column grid
    const cols = 2;
    const cellW = (panelW - 60) / cols;
    const cellH = 52;

    stats.forEach((stat, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const sx = panelX + 30 + col * (cellW + 6);
        const sy = startY + row * (cellH + 6);

        // Staggered animation
        const delay = i * 0.08;
        const statProgress = Math.min(1, Math.max(0, (performance.now() / 1000 - delay)));
        ctx.globalAlpha = statProgress;

        // Cell background
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.roundRect(sx, sy, cellW, cellH, 8);
        ctx.fill();

        // Label
        ctx.font = "400 9px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(stat.label, sx + 10, sy + 8);

        // Value
        ctx.font = "700 18px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = stat.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(stat.value, sx + 10, sy + cellH - 6);

        ctx.globalAlpha = 1;
    });

    // Duration display
    const durationY = startY + Math.ceil(stats.length / cols) * (cellH + 6) + 8;
    const mins = Math.floor(liveStats.duration / 60);
    const secs = Math.floor(liveStats.duration % 60);
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Duration: " + String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0"), cx || (panelX + panelW / 2), durationY);
}
