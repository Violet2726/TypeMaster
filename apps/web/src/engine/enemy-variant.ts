/**
 * Enemy Variant System - Elite enemies with special behaviors.
 *
 * Every 5 waves, elite variants appear with unique visual effects:
 *   Shielded:  Glass shield ring - must type shield word before enemy word
 *   Splitter:  Fracture glow - splits into 2 mini-enemies on death
 *   Dasher:    Speed lines - periodically dashes forward
 *
 * Variants are overlaid on existing enemy types (normal/fast/tank/boss).
 * They add visual flair and tactical depth without breaking core mechanics.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel, drawProgressRing } from "../components/game/draw-helpers";

export type VariantType = "shielded" | "splitter" | "dasher";

export interface VariantConfig {
    type: VariantType;
    color: string;
    glowColor: string;
    label: string;
}

const VARIANT_CONFIGS: Record<VariantType, VariantConfig> = {
    shielded: { type: "shielded", color: "#0a84ff", glowColor: "rgba(10,132,255,0.4)", label: "SHIELD" },
    splitter: { type: "splitter", color: "#bf5af2", glowColor: "rgba(191,90,242,0.4)", label: "SPLIT" },
    dasher:   { type: "dasher", color: "#ff9f0a", glowColor: "rgba(255,159,10,0.4)", label: "DASH" },
};

const SHIELD_WORDS = ["barrier", "shield", "guard", "armor", "wall", "block"];

// ---------------------------------------------------------------------------
// Variant Generation
// ---------------------------------------------------------------------------

export function shouldSpawnVariant(waveIndex: number): VariantType | null {
    if (waveIndex < 5) return null;
    if (waveIndex % 5 !== 0) return null;
    const types: VariantType[] = ["shielded", "splitter", "dasher"];
    return types[Math.floor(Math.random() * types.length)];
}

export function getVariantConfig(type: VariantType): VariantConfig {
    return VARIANT_CONFIGS[type];
}

export function getShieldWord(): string {
    return SHIELD_WORDS[Math.floor(Math.random() * SHIELD_WORDS.length)];
}

// ---------------------------------------------------------------------------
// Variant State
// ---------------------------------------------------------------------------

export interface VariantState {
    type: VariantType;
    shieldWord?: string;     // for shielded variant
    shieldTyped?: string;
    shieldActive: boolean;
    dashTimer: number;       // for dasher variant
    dashCooldown: number;
    splitOnDeath: boolean;   // for splitter variant
}

export function createVariantState(type: VariantType): VariantState {
    return {
        type,
        shieldWord: type === "shielded" ? getShieldWord() : undefined,
        shieldTyped: "",
        shieldActive: type === "shielded",
        dashTimer: 0,
        dashCooldown: 3,
        splitOnDeath: type === "splitter",
    };
}

// ---------------------------------------------------------------------------
// Variant Behavior Updates
// ---------------------------------------------------------------------------

export function updateVariant(variant: VariantState, dt: number): VariantState {
    if (variant.type === "dasher") {
        const newTimer = variant.dashTimer + dt;
        if (newTimer >= variant.dashCooldown) {
            return { ...variant, dashTimer: 0 }; // trigger dash
        }
        return { ...variant, dashTimer: newTimer };
    }
    return variant;
}

export function shouldDash(variant: VariantState): boolean {
    return variant.type === "dasher" && variant.dashTimer === 0;
}

export function processShieldInput(variant: VariantState, char: string): VariantState {
    if (variant.type !== "shielded" || !variant.shieldActive || !variant.shieldWord) return variant;

    const current = variant.shieldTyped || "";
    const nextIdx = current.length;

    if (char === variant.shieldWord[nextIdx]) {
        const newTyped = current + char;
        if (newTyped === variant.shieldWord) {
            return { ...variant, shieldTyped: newTyped, shieldActive: false };
        }
        return { ...variant, shieldTyped: newTyped };
    }
    return variant;
}

// ---------------------------------------------------------------------------
// Variant Rendering
// ---------------------------------------------------------------------------

export function drawVariantOverlay(
    ctx: CanvasRenderingContext2D,
    variant: VariantState,
    x: number, y: number,
    enemySize: number,
    time: number,
): void {
    const config = VARIANT_CONFIGS[variant.type];

    if (variant.type === "shielded" && variant.shieldActive) {
        // Glass shield ring
        const pulse = Math.sin(time * 0.004) * 0.2 + 0.8;
        ctx.save();
        ctx.translate(x, y);

        // Shield ring
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = config.glowColor;
        ctx.shadowBlur = 12 * pulse;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, enemySize + 12, 0, Math.PI * 2);
        ctx.stroke();

        // Shield word
        if (variant.shieldWord) {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.9;
            ctx.font = "500 10px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const word = variant.shieldWord;
            const typed = variant.shieldTyped || "";

            if (typed.length > 0) {
                const tw = ctx.measureText(typed).width;
                const fw = ctx.measureText(word).width;
                ctx.fillStyle = "#32d74b";
                ctx.textAlign = "left";
                ctx.fillText(typed, x - fw / 2, y - enemySize - 20);
                ctx.fillStyle = "rgba(255,255,255,0.6)";
                ctx.fillText(word.slice(typed.length), x - fw / 2 + tw, y - enemySize - 20);
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.fillText(word, x, y - enemySize - 20);
            }
        }

        ctx.restore();
    }

    if (variant.type === "splitter") {
        // Fracture lines radiating outward
        const fractureCount = 6;
        const pulse = Math.sin(time * 0.006) * 0.3 + 0.7;
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = 0.4 * pulse;
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = config.glowColor;
        ctx.shadowBlur = 8;

        for (let i = 0; i < fractureCount; i++) {
            const angle = (Math.PI * 2 / fractureCount) * i + time * 0.001;
            const inner = enemySize + 4;
            const outer = enemySize + 10 + Math.sin(time * 0.003 + i) * 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
            ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
            ctx.stroke();
        }

        ctx.restore();
    }

    if (variant.type === "dasher") {
        // Speed lines behind the enemy
        const dashProgress = variant.dashTimer / variant.dashCooldown;
        const lineCount = 3;
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = 0.3 * (1 - dashProgress);
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = config.glowColor;
        ctx.shadowBlur = 6;

        for (let i = 0; i < lineCount; i++) {
            const offsetX = (i - 1) * 8;
            const length = 15 + dashProgress * 10;
            ctx.beginPath();
            ctx.moveTo(offsetX, -enemySize - 5);
            ctx.lineTo(offsetX, -enemySize - 5 - length);
            ctx.stroke();
        }

        // Cooldown indicator
        if (dashProgress > 0.7) {
            ctx.globalAlpha = (dashProgress - 0.7) / 0.3;
            ctx.font = "bold 9px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = config.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("!", 0, -enemySize - 25);
        }

        ctx.restore();
    }
}

// Variant label badge (small tag above enemy)
export function drawVariantBadge(
    ctx: CanvasRenderingContext2D,
    variant: VariantState,
    x: number, y: number,
    enemySize: number,
): void {
    const config = VARIANT_CONFIGS[variant.type];
    const badgeW = 40;
    const badgeH = 14;
    const bx = x - badgeW / 2;
    const by = y - enemySize - 35;

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = config.color + "40";
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 7);
    ctx.fill();
    ctx.strokeStyle = config.color + "80";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "600 8px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = config.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(config.label, x, by + 7);
    ctx.restore();
}