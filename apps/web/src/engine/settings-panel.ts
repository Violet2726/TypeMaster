/**
 * Settings Panel - In-game settings accessible via Escape menu.
 *
 * Apple philosophy: settings should be minimal, intuitive, and persistent.
 * Accessible during pause state by pressing S key.
 *
 * Settings:
 *   - Master volume (0-100)
 *   - Music on/off
 *   - SFX on/off
 *   - Difficulty (easy/normal/hard)
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";

function getScale(w: number, h: number): number { return Math.max(0.6, Math.min(1.2, w / 800)); }
import { playMenuNavigate, playMenuBack, playMenuToggle } from "../components/game/sound-engine";

export interface GameSettings {
    volume: number;        // 0-100
    musicEnabled: boolean;
    sfxEnabled: boolean;
    difficulty: "easy" | "normal" | "hard";
    highContrast: boolean;  // Accessibility: high contrast mode
}

const STORAGE_KEY = "typing-raid-settings";

const DEFAULT_SETTINGS: GameSettings = {
    volume: 70,
    musicEnabled: true,
    sfxEnabled: true,
    difficulty: "normal",
    highContrast: false,
};

const DIFFICULTY_OPTIONS: { value: GameSettings["difficulty"]; label: string; desc: string }[] = [
    { value: "easy", label: "EASY", desc: "Slower enemies, more lives" },
    { value: "normal", label: "NORMAL", desc: "Standard experience" },
    { value: "hard", label: "HARD", desc: "Faster enemies, less lives" },
];

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export function loadSettings(): GameSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch {}
    return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
}

// ---------------------------------------------------------------------------
// Panel State
// ---------------------------------------------------------------------------

let isOpen = false;
let settings = loadSettings();
let selectedIndex = 0; // 0=volume, 1=music, 2=sfx, 3=difficulty

export function isSettingsOpen(): boolean { return isOpen; }
export function getSettings(): GameSettings { return settings; }

export function openSettings(): void { isOpen = true; selectedIndex = 0; }
export function closeSettings(): void { isOpen = false; }

export function handleSettingsKey(e: KeyboardEvent): boolean {
    if (!isOpen) return false;

    if (e.key === "Escape" || e.key === "s" || e.key === "S") {
        playMenuBack();
        closeSettings();
        return true;
    }

    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        playMenuNavigate();
        return true;
    }

    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        selectedIndex = Math.min(3, selectedIndex + 1);
        playMenuNavigate();
        return true;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const dir = e.key === "ArrowRight" ? 1 : -1;
        if (selectedIndex === 0) {
            // Volume
            settings.volume = Math.max(0, Math.min(100, settings.volume + dir * 10));
        } else if (selectedIndex === 1) {
            // Music toggle
            settings.musicEnabled = !settings.musicEnabled;
        } else if (selectedIndex === 2) {
            // SFX toggle
            settings.sfxEnabled = !settings.sfxEnabled;
        } else if (selectedIndex === 3) {
            // Difficulty
            const idx = DIFFICULTY_OPTIONS.findIndex(d => d.value === settings.difficulty);
            const newIdx = (idx + dir + DIFFICULTY_OPTIONS.length) % DIFFICULTY_OPTIONS.length;
            settings.difficulty = DIFFICULTY_OPTIONS[newIdx].value;
        }
        saveSettings(settings);
        playMenuToggle();
        return true;
    }

    // Enter to close
    if (e.key === "Enter") {
        closeSettings();
        return true;
    }

    return true; // consume all keys when open
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderSettingsPanel(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!isOpen) return;

    const panelW = 380;
    const panelH = 340;
    const panelX = w / 2 - panelW / 2;
    const panelY = h / 2 - panelH / 2;

    ctx.save();

    // Backdrop
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, w, h);

    // Panel
    drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 24);

    // Title
    ctx.font = "700 24px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Settings", w / 2, panelY + 35);

    // Settings items
    const items = [
        { label: "\u97f3\u91cf", value: settings.volume + "%", key: "volume" },
        { label: "\u97f3\u4e50", value: settings.musicEnabled ? "ON" : "OFF", key: "music" },
        { label: "\u97f3\u6548", value: settings.sfxEnabled ? "ON" : "OFF", key: "sfx" },
        { label: "\u96be\u5ea6", value: settings.difficulty.toUpperCase(), key: "difficulty" },
    ];

    items.forEach((item, i) => {
        const y = panelY + 80 + i * 55;
        const isSelected = i === selectedIndex;
        const pulse = isSelected ? Math.sin(time * 0.005) * 0.05 + 0.95 : 1;

        // Selection highlight
        if (isSelected) {
            ctx.fillStyle = "rgba(10,132,255,0.15)";
            ctx.beginPath();
            ctx.roundRect(panelX + 16, y - 18, panelW - 32, 42, 12);
            ctx.fill();

            ctx.strokeStyle = "rgba(10,132,255,0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.globalAlpha = pulse;

        // Label
        ctx.font = "500 15px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label, panelX + 32, y + 3);

        // Value with arrows
        ctx.textAlign = "right";
        ctx.fillStyle = isSelected ? "#0a84ff" : COLORS.textSecondary;
        ctx.fillText((isSelected ? "< " : "") + item.value + (isSelected ? " >" : ""), panelX + panelW - 32, y + 3);

        ctx.globalAlpha = 1;
    });

    // Volume bar visualization
    const volY = panelY + 80 + 16;
    const volBarX = panelX + panelW - 160;
    const volBarW = 100;
    const volBarH = 4;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.roundRect(volBarX, volY, volBarW, volBarH, 2);
    ctx.fill();
    ctx.fillStyle = "#0a84ff";
    ctx.beginPath();
    ctx.roundRect(volBarX, volY, volBarW * (settings.volume / 100), volBarH, 2);
    ctx.fill();

    // Footer hint
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.fillText("Arrow keys to adjust  |  Esc to close", w / 2, panelY + panelH - 25);

    ctx.restore();
}