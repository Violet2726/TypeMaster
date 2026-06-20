/**
 * Pause Menu - Apple-style navigation menu during pause.
 *
 * Three options with keyboard navigation:
 *   Continue - Resume the game with 3-2-1 countdown
 *   Settings - Open settings panel
 *   Quit     - Return to idle screen
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";

export type PauseAction = "continue" | "settings" | "quit" | null;

interface MenuItem {
    label: string;
    key: string;
    action: PauseAction;
    color: string;
}

const MENU_ITEMS: MenuItem[] = [
    { label: "Continue", key: "ESC", action: "continue", color: "#32d74b" },
    { label: "Settings", key: "S", action: "settings", color: "#0a84ff" },
    { label: "Quit", key: "Q", action: "quit", color: "#ff453a" },
];

let selectedIndex = 0;

export function resetPauseMenu(): void { selectedIndex = 0; }

export function handlePauseMenuKey(e: KeyboardEvent): PauseAction {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        return null;
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        selectedIndex = Math.min(MENU_ITEMS.length - 1, selectedIndex + 1);
        return null;
    }
    if (e.key === "Enter" || e.key === " ") {
        return MENU_ITEMS[selectedIndex].action;
    }
    // Direct shortcuts
    if (e.key === "Escape") return "continue";
    if (e.key === "q" || e.key === "Q") return "quit";
    return null;
}

export function renderPauseMenu(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const panelW = 320;
    const panelH = 300;
    const panelX = w / 2 - panelW / 2;
    const panelY = h / 2 - panelH / 2;

    ctx.save();

    // Panel with breathing border
    drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 24);

    const breath = Math.sin(time * 0.002) * 0.02 + 0.12;
    ctx.strokeStyle = "rgba(255,255,255," + breath + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 24);
    ctx.stroke();

    // Title
    ctx.font = "700 28px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Paused", w / 2, panelY + 45);

    // Menu items
    MENU_ITEMS.forEach((item, i) => {
        const y = panelY + 100 + i * 58;
        const isSelected = i === selectedIndex;
        const pulse = isSelected ? Math.sin(time * 0.005) * 0.05 + 0.95 : 1;

        // Selection highlight
        if (isSelected) {
            ctx.fillStyle = "rgba(10,132,255,0.12)";
            ctx.beginPath();
            ctx.roundRect(panelX + 20, y - 18, panelW - 40, 44, 12);
            ctx.fill();

            ctx.strokeStyle = "rgba(10,132,255,0.25)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.globalAlpha = pulse;

        // Icon circle
        ctx.fillStyle = item.color + "30";
        ctx.beginPath();
        ctx.arc(panelX + 46, y + 3, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "600 12px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = item.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label[0], panelX + 46, y + 3);

        // Label
        ctx.font = "500 16px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = isSelected ? COLORS.text : COLORS.textSecondary;
        ctx.textAlign = "left";
        ctx.fillText(item.label, panelX + 70, y + 3);

        // Shortcut key
        ctx.font = "500 12px SF Mono, Cascadia Mono, monospace";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "right";
        ctx.fillText(item.key, panelX + panelW - 30, y + 3);

        ctx.globalAlpha = 1;
    });

    // Footer hint
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Arrow keys to navigate  |  Enter to select", w / 2, panelY + panelH - 25);

    ctx.restore();
}