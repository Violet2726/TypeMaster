/**
 * Tutorial Overlay - First-time player guidance.
 *
 * Apple philosophy: guide without patronizing. Show controls once,
 * then get out of the way. Auto-dismisses after 4 seconds or any key.
 * Remembers dismissal in localStorage.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";

const STORAGE_KEY = "typing-raid-tutorial-seen";

let isShowing = false;
let showTime = 0;
let dismissed = false;
const AUTO_DISMISS = 4; // seconds

const CONTROLS = [
    { key: "TYPE", desc: "Type enemy words to destroy them" },
    { key: "ESC", desc: "Pause / Resume game" },
    { key: "S", desc: "Settings (while paused)" },
    { key: "R", desc: "Restart after game over" },
];

export function shouldShowTutorial(): boolean {
    try {
        return !localStorage.getItem(STORAGE_KEY);
    } catch {
        return true;
    }
}

export function showTutorial(): void {
    if (!shouldShowTutorial()) return;
    isShowing = true;
    showTime = performance.now();
}

export function dismissTutorial(): void {
    if (!isShowing) return;
    isShowing = false;
    dismissed = true;
    try {
        localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
}

export function isTutorialShowing(): boolean { return isShowing; }

export function handleTutorialKey(): boolean {
    if (!isShowing) return false;
    dismissTutorial();
    return true;
}

export function updateTutorial(time: number): void {
    if (!isShowing) return;
    const elapsed = (time - showTime) / 1000;
    if (elapsed > AUTO_DISMISS) dismissTutorial();
}

export function renderTutorial(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!isShowing) return;

    const elapsed = (time - showTime) / 1000;
    // Fade in 0-0.5s, show 0.5-3.5s, fade out 3.5-4s
    let alpha = 1;
    if (elapsed < 0.5) alpha = elapsed / 0.5;
    else if (elapsed > AUTO_DISMISS - 0.5) alpha = (AUTO_DISMISS - elapsed) / 0.5;
    alpha = Math.max(0, Math.min(1, alpha));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Semi-transparent backdrop
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, w, h);

    // Panel
    const panelW = 360;
    const panelH = 280;
    const panelX = w / 2 - panelW / 2;
    const panelY = h / 2 - panelH / 2;
    drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 24);

    // Title
    ctx.font = "700 24px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Quick Start", w / 2, panelY + 40);

    // Controls list
    CONTROLS.forEach((ctrl, i) => {
        const y = panelY + 90 + i * 44;

        // Key badge
        const keyW = Math.max(40, ctx.measureText(ctrl.key).width + 20);
        const keyX = panelX + 30;

        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.roundRect(keyX, y - 12, keyW, 24, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "600 12px SF Mono, Cascadia Mono, monospace";
        ctx.fillStyle = "#0a84ff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ctrl.key, keyX + keyW / 2, y);

        // Description
        ctx.font = "400 14px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = "left";
        ctx.fillText(ctrl.desc, keyX + keyW + 16, y);
    });

    // Dismiss hint
    const hintPulse = Math.sin(time * 0.004) * 0.2 + 0.8;
    ctx.globalAlpha = alpha * hintPulse;
    ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.fillText("Press any key to start", w / 2, panelY + panelH - 30);

    ctx.restore();
}