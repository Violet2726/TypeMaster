/**
 * Stats History - View past game records and progress.
 *
 * Apple design: clean data presentation, no clutter.
 * Shows recent games, best records, and progress sparklines.
 * Accessible from idle screen by pressing H.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";
import { DataVizRenderer } from "./data-viz";

interface GameRecord {
    score: number;
    wave: number;
    wpm: number;
    accuracy: number;
    maxCombo: number;
    date: string;
}

const STORAGE_KEY = "typing-raid-history";
const MAX_RECORDS = 20;

let records: GameRecord[] = [];
let isOpen = false;
let scrollOffset = 0;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export function loadHistory(): GameRecord[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

export function saveGameRecord(record: GameRecord): void {
    records = [record, ...records].slice(0, MAX_RECORDS);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {}
}

export function getBestRecord(): GameRecord | null {
    if (records.length === 0) return null;
    return records.reduce((best, r) => r.score > best.score ? r : best, records[0]);
}

// ---------------------------------------------------------------------------
// Panel State
// ---------------------------------------------------------------------------

export function isStatsOpen(): boolean { return isOpen; }

export function openStats(): void {
    records = loadHistory();
    isOpen = true;
    scrollOffset = 0;
}

export function closeStats(): void { isOpen = false; }

export function handleStatsKey(e: KeyboardEvent): boolean {
    if (!isOpen) return false;
    if (e.key === "Escape" || e.key === "h" || e.key === "H") {
        closeStats();
        return true;
    }
    if (e.key === "ArrowUp") { scrollOffset = Math.max(0, scrollOffset - 1); return true; }
    if (e.key === "ArrowDown") { scrollOffset = Math.min(Math.max(0, records.length - 5), scrollOffset + 1); return true; }
    return true;
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

function drawSparkline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, values: number[], color: string): void {
    if (values.length < 2) return;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();

    for (let i = 0; i < values.length; i++) {
        const px = x + (i / (values.length - 1)) * w;
        const py = y + h - ((values[i] - min) / range) * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Gradient fill under the line
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fillStyle = color.replace(")", ",0.1)").replace("rgb", "rgba");
    ctx.fill();
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderStatsHistory(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!isOpen) return;

    const panelW = Math.min(480, w - 40);
    const panelH = Math.min(500, h - 40);
    const panelX = w / 2 - panelW / 2;
    const panelY = h / 2 - panelH / 2;

    ctx.save();

    // Backdrop
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, w, h);

    // Panel
    drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 24);

    // Title
    ctx.font = "700 24px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Statistics", w / 2, panelY + 35);

    if (records.length === 0) {
        ctx.font = "400 14px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textSecondary;
        ctx.fillText("No games played yet", w / 2, panelY + panelH / 2);
        ctx.restore();
        return;
    }

    // Best record summary
    const best = getBestRecord();
    if (best) {
        const bestY = panelY + 65;
        drawGlassPanel(ctx, panelX + 16, bestY, panelW - 32, 50, 12);

        ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("BEST", panelX + 28, bestY + 8);

        ctx.font = "600 18px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = COLORS.text;
        ctx.fillText(String(best.score), panelX + 28, bestY + 24);

        ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = "right";
        ctx.fillText("Wave " + best.wave + "  |  " + best.wpm + " WPM  |  " + best.accuracy + "%", panelX + panelW - 28, bestY + 28);
    }

    // Score sparkline
    const sparkY = panelY + 130;
    const sparkW = panelW - 60;
    const sparkH = 50;
    const sparkX = panelX + 30;

    const scores = records.map(r => r.score).reverse();
    drawSparkline(ctx, sparkX, sparkY, sparkW, sparkH, scores, "#0a84ff");

    ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Score Trend", sparkX, sparkY - 14);

    ctx.textAlign = "right";
    ctx.fillText(records.length + " games", sparkX + sparkW, sparkY - 14);

    // Recent games list
    const listY = sparkY + sparkH + 24;
    const itemH = 44;
    const visibleItems = Math.min(5, records.length - scrollOffset);

    ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "left";
    ctx.fillText("Recent Games", panelX + 20, listY - 14);

    for (let i = 0; i < visibleItems; i++) {
        const ri = i + scrollOffset;
        if (ri >= records.length) break;
        const r = records[ri];
        const y = listY + i * itemH;

        // Row background
        ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent";
        ctx.beginPath();
        ctx.roundRect(panelX + 16, y, panelW - 32, itemH - 4, 8);
        ctx.fill();

        // Score
        ctx.font = "600 14px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(String(r.score), panelX + 28, y + itemH / 2 - 2);

        // Details
        ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = "right";
        ctx.fillText("W" + r.wave + "  " + r.wpm + "wpm  " + r.accuracy + "%", panelX + panelW - 28, y + itemH / 2 - 2);

        // Date
        ctx.font = "400 9px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "right";
        ctx.fillText(r.date, panelX + panelW - 28, y + itemH / 2 + 10);
    }

    // Scroll indicators
    if (scrollOffset > 0) {
        ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "center";
        ctx.fillText("...", w / 2, listY - 2);
    }
    if (scrollOffset + 5 < records.length) {
        ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "center";
        ctx.fillText("...", w / 2, listY + visibleItems * itemH + 6);
    }

    // Footer
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.fillText("Esc to close  |  Arrow keys to scroll", w / 2, panelY + panelH - 20);

    ctx.restore();
}



