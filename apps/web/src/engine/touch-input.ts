/**
 * Touch Input - Enhanced mobile/tablet support.
 *
 * Apple philosophy: touch should feel natural and responsive.
 * Every tap should produce visible feedback. Gestures should
 * be intuitive and discoverable.
 *
 * Features:
 * 1. Hidden input field for native keyboard
 * 2. Touch ripple effects on canvas
 * 3. Swipe left/right to switch target enemy
 * 4. Double-tap to pause
 * 5. Responsive canvas scaling
 */

export interface TouchInputConfig {
    onChar: (char: string) => void;
    onKey: (key: string) => void;
    onSwipe?: (direction: 'left' | 'right') => void;
    onDoubleTap?: () => void;
}

let inputEl: HTMLInputElement | null = null;
let isActive = false;
let lastValue = "";

// Touch tracking
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let lastTapTime = 0;
const SWIPE_THRESHOLD = 50;
const DOUBLE_TAP_DELAY = 300;

// Visual feedback
interface TouchRipple {
    x: number;
    y: number;
    startTime: number;
    color: string;
}

const ripples: TouchRipple[] = [];
let canvasEl: HTMLCanvasElement | null = null;
let touchConfig: TouchInputConfig | null = null;

export function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && "ontouchstart" in window);
}

export function initTouchInput(config: TouchInputConfig): void {
    if (!isMobile()) return;
    touchConfig = config;

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
            const newChar = val.slice(lastValue.length);
            for (const ch of newChar) {
                config.onChar(ch.toLowerCase());
            }
        }
        lastValue = val;
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

    // Touch events on canvas
    canvasEl = document.querySelector("canvas.game-canvas") as HTMLCanvasElement;
    if (canvasEl) {
        canvasEl.addEventListener("touchstart", handleTouchStart, { passive: false });
        canvasEl.addEventListener("touchend", handleTouchEnd, { passive: false });
        canvasEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    }
}

function handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = performance.now();

    // Create ripple
    const rect = canvasEl?.getBoundingClientRect();
    if (rect) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        ripples.push({
            x, y,
            startTime: performance.now(),
            color: 'rgba(255,255,255,0.3)',
        });
        if (ripples.length > 10) ripples.shift();
    }

    focusInput();
}

function handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const elapsed = performance.now() - touchStartTime;

    // Swipe detection (only if horizontal movement > threshold and faster than vertical)
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5 && elapsed < 500) {
        const direction = dx > 0 ? 'right' : 'left';
        touchConfig?.onSwipe?.(direction);

        // Swipe ripple
        const rect = canvasEl?.getBoundingClientRect();
        if (rect) {
            ripples.push({
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top,
                startTime: performance.now(),
                color: direction === 'right' ? 'rgba(50,199,89,0.4)' : 'rgba(10,132,255,0.4)',
            });
        }
        return;
    }

    // Double-tap detection
    const now = performance.now();
    if (now - lastTapTime < DOUBLE_TAP_DELAY && elapsed < 200) {
        touchConfig?.onDoubleTap?.();
    }
    lastTapTime = now;
}

function handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
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
    if (canvasEl) {
        canvasEl.removeEventListener("touchstart", handleTouchStart);
        canvasEl.removeEventListener("touchend", handleTouchEnd);
        canvasEl.removeEventListener("touchmove", handleTouchMove);
        canvasEl = null;
    }
    if (inputEl) {
        inputEl.remove();
        inputEl = null;
    }
    touchConfig = null;
}

// ---------------------------------------------------------------------------
// Visual Feedback Rendering
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

export function renderTouchRipples(ctx: CanvasRenderingContext2D, time: number): void {
    const now = time;
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const elapsed = (now - r.startTime) / 600;
        if (elapsed >= 1) {
            ripples.splice(i, 1);
            continue;
        }

        const t = elapsed;
        const radius = 30 + t * 40;
        const alpha = (1 - t) * 0.4;

        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2 * (1 - t);
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.fillStyle = r.color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Responsive Canvas Scaling
// ---------------------------------------------------------------------------

export function getResponsiveScale(): number {
    if (!isMobile()) return 1;
    const w = window.innerWidth;
    if (w <= 375) return 0.65;      // iPhone SE
    if (w <= 414) return 0.7;       // iPhone 12 Mini
    if (w <= 430) return 0.75;      // iPhone 14 Pro Max
    if (w <= 768) return 0.8;       // iPad Mini
    return 1;
}
