/**
 * Touch Input - Mobile/tablet support.
 *
 * Uses a hidden input field to trigger the native mobile keyboard.
 * Touch events for menu interactions.
 * Responsive layout adjustments for small screens.
 */

export interface TouchInputConfig {
    onChar: (char: string) => void;
    onKey: (key: string) => void;
}

let inputEl: HTMLInputElement | null = null;
let isActive = false;
let lastValue = "";

export function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && "ontouchstart" in window);
}

export function initTouchInput(config: TouchInputConfig): void {
    if (!isMobile()) return;

    // Create hidden input field
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.autocomplete = "off";
    inputEl.autocapitalize = "off";
    inputEl.spellcheck = false;
    inputEl.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
    document.body.appendChild(inputEl);

    // Handle input events
    inputEl.addEventListener("input", () => {
        if (!inputEl) return;
        const val = inputEl.value;
        if (val.length > lastValue.length) {
            // New character typed
            const newChar = val.slice(lastValue.length);
            for (const ch of newChar) {
                config.onChar(ch.toLowerCase());
            }
        }
        lastValue = val;
        // Keep input field manageable
        if (val.length > 20) {
            inputEl.value = val.slice(-10);
            lastValue = inputEl.value;
        }
    });

    // Handle special keys
    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === "Backspace") {
            config.onKey(e.key);
        }
    });

    // Touch event for canvas - focus input on tap
    const canvas = document.querySelector("canvas.game-canvas");
    if (canvas) {
        canvas.addEventListener("touchstart", (e) => {
            e.preventDefault();
            focusInput();
        }, { passive: false });
    }
}

export function focusInput(): void {
    if (!inputEl) return;
    inputEl.focus();
    isActive = true;
}

export function blurInput(): void {
    if (!inputEl) return;
    inputEl.blur();
    isActive = false;
}

export function clearInput(): void {
    if (!inputEl) return;
    inputEl.value = "";
    lastValue = "";
}

export function isTouchActive(): boolean { return isActive; }

export function destroyTouchInput(): void {
    if (inputEl) {
        inputEl.remove();
        inputEl = null;
    }
}

// ---------------------------------------------------------------------------
// Touch UI Indicator
// ---------------------------------------------------------------------------

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";

export function drawTouchIndicator(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!isMobile()) return;

    const pulse = Math.sin(time * 0.003) * 0.2 + 0.8;
    const y = h - 60;

    ctx.save();
    ctx.globalAlpha = pulse * 0.6;

    drawGlassPanel(ctx, w / 2 - 100, y, 200, 36, 18);

    ctx.font = "500 13px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textSecondary;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isActive ? "Typing..." : "Tap to type", w / 2, y + 18);

    ctx.restore();
}