/**
 * Power-up System
 *
 * Strategic layer: enemies drop collectible power-ups that grant temporary abilities.
 * Drop rate scales by enemy type (boss = guaranteed, normal = rare).
 * Power-ups orbit at their spawn point and expire after 6 seconds.
 * Player types the power-up word to collect it.
 */

export type PowerUpType = "shield" | "slow" | "double" | "bomb";

export interface PowerUp {
    id: string;
    type: PowerUpType;
    x: number;
    y: number;
    word: string;
    typed: string;
    spawnTime: number;
    lifetime: number;    // seconds before expiry
    orbitRadius: number;
    orbitSpeed: number;
    alive: boolean;
}

export interface ActivePowerUp {
    type: PowerUpType;
    remaining: number;   // seconds left
    duration: number;    // total duration
}

const POWER_UP_CONFIG: Record<PowerUpType, {
    color: string;
    glow: string;
    icon: string;
    duration: number;
    label: string;
}> = {
    shield:  { color: "#0a84ff", glow: "rgba(10,132,255,0.5)",  icon: "S", duration: 15, label: "SHIELD" },
    slow:    { color: "#bf5af2", glow: "rgba(191,90,242,0.5)",  icon: "T", duration: 5,  label: "SLOW" },
    double:  { color: "#ffd60a", glow: "rgba(255,214,10,0.5)",  icon: "2", duration: 8,  label: "2X" },
    bomb:    { color: "#ff453a", glow: "rgba(255,69,58,0.5)",   icon: "!", duration: 0,  label: "BOMB" },
};

const DROP_WORDS: Record<PowerUpType, string[]> = {
    shield: ["guard", "block", "armor", "safe", "cover"],
    slow:   ["freeze", "pause", "slow", "halt", "chill"],
    double: ["boost", "double", "bonus", "extra", "plus"],
    bomb:   ["blast", "burst", "nuke", "boom", "wipe"],
};

export function getPowerUpConfig(type: PowerUpType) {
    return POWER_UP_CONFIG[type];
}

export function shouldDropPowerUp(enemyType: string): PowerUpType | null {
    const rates: Record<string, number> = { normal: 0.08, fast: 0.12, tank: 0.25, boss: 1.0 };
    if (Math.random() > (rates[enemyType] || 0.08)) return null;
    const types: PowerUpType[] = ["shield", "slow", "double", "bomb"];
    const weights = [0.3, 0.25, 0.3, 0.15];
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < types.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) return types[i];
    }
    return "shield";
}

export function createPowerUp(type: PowerUpType, x: number, y: number): PowerUp {
    const words = DROP_WORDS[type];
    return {
        id: "pu-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
        type,
        x, y,
        word: words[Math.floor(Math.random() * words.length)],
        typed: "",
        spawnTime: performance.now(),
        lifetime: 6,
        orbitRadius: 4 + Math.random() * 4,
        orbitSpeed: 1.5 + Math.random() * 1.5,
        alive: true,
    };
}

export function updatePowerUps(powerUps: PowerUp[], dt: number): PowerUp[] {
    const now = performance.now();
    return powerUps.map(pu => {
        if (!pu.alive) return pu;
        const age = (now - pu.spawnTime) / 1000;
        if (age > pu.lifetime) return { ...pu, alive: false };
        return pu;
    });
}

export function processPowerUpInput(
    powerUps: PowerUp[],
    char: string,
    activeEnemyId: string | null
): { powerUps: PowerUp[]; collected: PowerUpType[]; events: any[] } {
    // Only process if no enemy is actively being typed
    if (activeEnemyId) return { powerUps, collected: [], events: [] };

    const events: any[] = [];
    const collected: PowerUpType[] = [];

    const updated = powerUps.map(pu => {
        if (!pu.alive) return pu;

        if (pu.typed.length === 0) {
            if (char === pu.word[0]) {
                const newTyped = char;
                if (newTyped === pu.word) {
                    collected.push(pu.type);
                    events.push({ type: "powerup_collected", powerUpType: pu.type, id: pu.id });
                    return { ...pu, typed: newTyped, alive: false };
                }
                return { ...pu, typed: newTyped };
            }
        } else {
            const nextIdx = pu.typed.length;
            if (char === pu.word[nextIdx]) {
                const newTyped = pu.typed + char;
                if (newTyped === pu.word) {
                    collected.push(pu.type);
                    events.push({ type: "powerup_collected", powerUpType: pu.type, id: pu.id });
                    return { ...pu, typed: newTyped, alive: false };
                }
                return { ...pu, typed: newTyped };
            }
        }
        return pu;
    });

    return { powerUps: updated, collected, events };
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, time: number): void {
    if (!pu.alive) return;

    const config = POWER_UP_CONFIG[pu.type];
    const age = (time - pu.spawnTime) / 1000;
    const fadeIn = Math.min(1, age / 0.3);
    const fadeOut = age > pu.lifetime - 1 ? (pu.lifetime - age) : 1;
    const alpha = fadeIn * fadeOut;

    // Orbit wobble
    const orbitX = Math.cos(time * 0.001 * pu.orbitSpeed) * pu.orbitRadius;
    const orbitY = Math.sin(time * 0.001 * pu.orbitSpeed) * pu.orbitRadius;

    const x = pu.x + orbitX;
    const y = pu.y + orbitY;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow ring
    const ringPulse = Math.sin(time * 0.004) * 0.3 + 0.7;
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = config.glow;
    ctx.shadowBlur = 12 * ringPulse;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating dashes around ring
    const dashAngle = time * 0.003;
    for (let i = 0; i < 4; i++) {
        const a = dashAngle + (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.arc(x, y, 22, a, a + 0.4);
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha * 0.6;
        ctx.stroke();
    }
    ctx.globalAlpha = alpha;

    // Inner filled circle
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 14);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.4, config.color);
    grad.addColorStop(1, config.color + "60");
    ctx.fillStyle = grad;
    ctx.shadowColor = config.glow;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Icon letter
    ctx.shadowBlur = 0;
    ctx.font = "bold 14px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(config.icon, x, y);

    // Word below
    ctx.font = "500 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    const word = pu.word;
    const typed = pu.typed || "";

    if (typed.length > 0) {
        const typedW = ctx.measureText(typed).width;
        const fullW = ctx.measureText(word).width;
        const startX = x - fullW / 2;
        ctx.fillStyle = "#32d74b";
        ctx.textAlign = "left";
        ctx.fillText(typed, startX, y + 28);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(word.slice(typed.length), startX + typedW, y + 28);
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "center";
        ctx.fillText(word, x, y + 28);
    }

    // Expiry warning flash
    if (age > pu.lifetime - 2) {
        const flash = Math.sin(time * 0.015) > 0 ? 0.4 : 0;
        ctx.globalAlpha = alpha * flash;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export function drawActivePowerUps(ctx: CanvasRenderingContext2D, actives: ActivePowerUp[], w: number, time: number): void {
    if (actives.length === 0) return;

    const startX = 20;
    const startY = 80;

    actives.forEach((ap, i) => {
        const config = POWER_UP_CONFIG[ap.type];
        const progress = ap.remaining / ap.duration;
        const y = startY + i * 32;

        // Glass background
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.roundRect(startX, y, 120, 26, 8);
        ctx.fill();

        // Progress bar
        ctx.fillStyle = config.color + "40";
        ctx.beginPath();
        ctx.roundRect(startX, y, 120 * progress, 26, 8);
        ctx.fill();

        // Border
        ctx.strokeStyle = config.color + "60";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(startX, y, 120, 26, 8);
        ctx.stroke();

        // Icon
        ctx.font = "bold 11px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = config.color;
        ctx.fillText(config.icon, startX + 8, y + 13);

        // Label
        ctx.font = "500 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(config.label, startX + 22, y + 13);

        // Time remaining
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(Math.ceil(ap.remaining) + "s", startX + 114, y + 13);
    });
}