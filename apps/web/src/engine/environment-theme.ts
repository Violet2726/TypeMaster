/**
 * Environment Theme System
 *
 * Progressive visual narrative: background evolves as the player advances.
 * Three themes blend smoothly based on wave count:
 *   Wave 1-5:  Deep Space  (dark, minimal, focused)
 *   Wave 6-12: Nebula      (purple/pink, ethereal, growing intensity)
 *   Wave 13+:  Black Hole  (red/orange, intense, cosmic)
 *
 * Apple philosophy: the environment should feel alive and purposeful,
 * not decorative. Each theme shift signals escalating stakes.
 */

export interface EnvironmentTheme {
    name: string;
    bgTop: string;
    bgBottom: string;
    gridColor: string;
    gridOpacity: number;
    starCount: number;
    starColor: string;
    nebulaColors: string[];   // floating nebula blobs
    nebulaCount: number;
    vignetteStrength: number;
    particleRate: number;     // ambient particle spawn rate (0-1)
    particleColor: string;
    scanlineOpacity: number;
}

const DEEP_SPACE: EnvironmentTheme = {
    name: "deep-space",
    bgTop: "#0a0a0c",
    bgBottom: "#1a1a2e",
    gridColor: "rgba(255,255,255,0.04)",
    gridOpacity: 0.04,
    starCount: 60,
    starColor: "rgba(255,255,255,",
    nebulaColors: [],
    nebulaCount: 0,
    vignetteStrength: 0.35,
    particleRate: 0.08,
    particleColor: "rgba(255,255,255,0.3)",
    scanlineOpacity: 0,
};

const NEBULA: EnvironmentTheme = {
    name: "nebula",
    bgTop: "#0f0a1e",
    bgBottom: "#1e0a2e",
    gridColor: "rgba(191,90,242,0.06)",
    gridOpacity: 0.06,
    starCount: 80,
    starColor: "rgba(200,180,255,",
    nebulaColors: ["rgba(191,90,242,0.08)", "rgba(255,55,95,0.06)", "rgba(10,132,255,0.05)"],
    nebulaCount: 4,
    vignetteStrength: 0.4,
    particleRate: 0.12,
    particleColor: "rgba(191,90,242,0.4)",
    scanlineOpacity: 0.02,
};

const BLACK_HOLE: EnvironmentTheme = {
    name: "black-hole",
    bgTop: "#1a0505",
    bgBottom: "#0a0a0c",
    gridColor: "rgba(255,69,58,0.05)",
    gridOpacity: 0.05,
    starCount: 100,
    starColor: "rgba(255,200,150,",
    nebulaColors: ["rgba(255,69,58,0.1)", "rgba(255,159,10,0.08)", "rgba(255,214,10,0.05)"],
    nebulaCount: 6,
    vignetteStrength: 0.5,
    particleRate: 0.15,
    particleColor: "rgba(255,100,50,0.5)",
    scanlineOpacity: 0.03,
};

const THEMES: EnvironmentTheme[] = [DEEP_SPACE, NEBULA, BLACK_HOLE];
const WAVE_THRESHOLDS = [1, 6, 13]; // wave number where each theme starts
const TRANSITION_DURATION = 3; // waves over which blend occurs

// ---------------------------------------------------------------------------
// Color interpolation
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return [0, 0, 0];
    return [
        parseInt(m[1].slice(0, 2), 16),
        parseInt(m[1].slice(2, 4), 16),
        parseInt(m[1].slice(4, 6), 16),
    ];
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

function lerpHex(a: string, b: string, t: number): string {
    const [r1, g1, b1] = hexToRgb(a);
    const [r2, g2, b2] = hexToRgb(b);
    return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function lerpNum(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Theme Manager
// ---------------------------------------------------------------------------

export function getBlendedTheme(wave: number): EnvironmentTheme {
    if (wave <= 0) return DEEP_SPACE;

    // Find which theme segment we are in
    let themeIndex = 0;
    for (let i = WAVE_THRESHOLDS.length - 1; i >= 0; i--) {
        if (wave >= WAVE_THRESHOLDS[i]) {
            themeIndex = i;
            break;
        }
    }

    const currentTheme = THEMES[themeIndex];
    const nextTheme = THEMES[Math.min(themeIndex + 1, THEMES.length - 1)];

    // Calculate blend factor within transition zone
    const waveSinceThreshold = wave - WAVE_THRESHOLDS[themeIndex];
    const blendStart = TRANSITION_DURATION * 0.5; // start blending halfway through
    const t = themeIndex >= THEMES.length - 1 ? 0 : Math.min(1, Math.max(0, (waveSinceThreshold - blendStart) / (TRANSITION_DURATION * 0.5)));

    if (t === 0) return currentTheme;

    // Blend the two themes
    return {
        name: currentTheme.name + " -> " + nextTheme.name,
        bgTop: lerpHex(currentTheme.bgTop, nextTheme.bgTop, t),
        bgBottom: lerpHex(currentTheme.bgBottom, nextTheme.bgBottom, t),
        gridColor: "rgba(255,255,255," + lerpNum(currentTheme.gridOpacity, nextTheme.gridOpacity, t).toFixed(3) + ")",
        gridOpacity: lerpNum(currentTheme.gridOpacity, nextTheme.gridOpacity, t),
        starCount: Math.round(lerpNum(currentTheme.starCount, nextTheme.starCount, t)),
        starColor: currentTheme.starColor, // keep current star color
        nebulaColors: t < 0.5 ? currentTheme.nebulaColors : nextTheme.nebulaColors,
        nebulaCount: Math.round(lerpNum(currentTheme.nebulaCount, nextTheme.nebulaCount, t)),
        vignetteStrength: lerpNum(currentTheme.vignetteStrength, nextTheme.vignetteStrength, t),
        particleRate: lerpNum(currentTheme.particleRate, nextTheme.particleRate, t),
        particleColor: t < 0.5 ? currentTheme.particleColor : nextTheme.particleColor,
        scanlineOpacity: lerpNum(currentTheme.scanlineOpacity, nextTheme.scanlineOpacity, t),
    };
}

// ---------------------------------------------------------------------------
// Theme-aware rendering helpers
// ---------------------------------------------------------------------------

export function drawThemedBackground(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, theme: EnvironmentTheme, combo: number): void {
    // Dynamic hue shift based on combo (subtle)
    const hueShift = Math.min(30, combo) * 1.5;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, shiftHue(theme.bgTop, hueShift));
    gradient.addColorStop(1, shiftHue(theme.bgBottom, hueShift));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Grid with theme color
    if (theme.gridOpacity > 0.01) {
        ctx.strokeStyle = theme.gridColor;
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    // Stars with parallax depth and theme color
    for (let i = 0; i < theme.starCount; i++) {
        const depth = (i % 3 + 1) / 3;
        const sx = (i * 137.5 + time * 0.005 * depth) % w;
        const sy = (i * 97.3 + time * 0.002 * depth) % h;
        const alpha = 0.1 + depth * 0.2 + Math.sin(time * 0.001 + i) * 0.05;
        ctx.fillStyle = theme.starColor + alpha.toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(sx, sy, 0.5 + depth, 0, Math.PI * 2);
        ctx.fill();
    }

    // Nebula blobs (only for nebula/black-hole themes)
    if (theme.nebulaCount > 0) {
        for (let i = 0; i < theme.nebulaCount; i++) {
            const color = theme.nebulaColors[i % theme.nebulaColors.length];
            const nx = (i * 251.3 + time * 0.001 * (i + 1)) % w;
            const ny = (i * 173.7 + time * 0.0008 * (i + 1)) % h;
            const radius = 80 + i * 30 + Math.sin(time * 0.0005 + i * 2) * 20;

            const nebulaGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
            nebulaGrad.addColorStop(0, color);
            nebulaGrad.addColorStop(1, "transparent");
            ctx.fillStyle = nebulaGrad;
            ctx.beginPath();
            ctx.arc(nx, ny, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Scanlines (subtle horizontal lines for CRT/retro feel at high waves)
    if (theme.scanlineOpacity > 0) {
        ctx.fillStyle = "rgba(0,0,0," + theme.scanlineOpacity + ")";
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 1);
        }
    }

    // Vignette
    if (theme.vignetteStrength > 0) {
        const vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
        vignetteGrad.addColorStop(0, "rgba(0,0,0,0)");
        vignetteGrad.addColorStop(1, "rgba(0,0,0," + theme.vignetteStrength + ")");
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, w, h);
    }
}

// ---------------------------------------------------------------------------
// Hue shift helper (same as engine)
// ---------------------------------------------------------------------------

function shiftHue(hex: string, degrees: number): string {
    if (!hex || degrees === 0) return hex;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    const shift = degrees / 360;
    const temp = r;
    r = Math.round(r * (1 - shift) + g * shift);
    g = Math.round(g * (1 - shift) + b * shift);
    b = Math.round(b * (1 - shift) + temp * shift);
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}