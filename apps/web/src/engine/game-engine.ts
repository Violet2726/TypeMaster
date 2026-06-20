/**
 * Typing Raid Game Engine
 *
 * Central orchestrator: game loop, event dispatch, effect coordination.
 * Extracted from the 956-line monolith GamePage.tsx to enforce separation
 * between domain logic (packages/domain), engine coordination (this file),
 * and presentation (GamePage.tsx).
 */

import {
    createGameState, transitionGameMode, processInput, updateGameState,
    startWave, processSpawns, buildGameResult, getGameCopy,
    getEnemyTypeConfig, getComboMultiplier, commonWords, biasWordPool,
} from "@typemaster/domain";
import { ParticleSystem, ScreenShake } from "./particle-system";
import { ScorePopupSystem } from "./score-popup";
import { COLORS } from "../components/game/colors";
import { drawGlassPanel, drawProgressRing } from "../components/game/draw-helpers";
import { initSound, playClickSound, playKillSound, playErrorSound, playComboSound } from "../components/game/sound-engine";
import { getBlendedTheme, drawThemedBackground } from "./environment-theme";
import { initGameOver, renderGameOver, clearGameOver } from "./game-over";
import { createMusicEngine } from "./music-engine";
import { enqueueAchievement, updateAchievementModal, renderAchievementModal, clearAchievementQueue } from "./achievement-modal";
import { openSettings, closeSettings, isSettingsOpen, handleSettingsKey, renderSettingsPanel, getSettings } from "./settings-panel";
import { showTutorial, isTutorialShowing, handleTutorialKey, updateTutorial, renderTutorial } from "./tutorial-overlay";
import { handlePauseMenuKey, renderPauseMenu, resetPauseMenu } from "./pause-menu";
import { triggerComboFlash, updateComboFx, drawComboFx, resetComboFx } from "./combo-fx";
import { updateHud, drawEnhancedHud, resetHud } from "./hud-overlay";
import { openStats, isStatsOpen, handleStatsKey, renderStatsHistory, saveGameRecord } from "./stats-history";
import { shouldSpawnVariant, createVariantState, updateVariant, processShieldInput, drawVariantOverlay, drawVariantBadge } from "./enemy-variant";
import type { VariantState, VariantType } from "./enemy-variant";
import { shouldDropPowerUp, createPowerUp, updatePowerUps, processPowerUpInput, drawPowerUp, drawActivePowerUps, getPowerUpConfig } from "./power-up";
import type { PowerUp, ActivePowerUp, PowerUpType } from "./power-up";

// ---------------------------------------------------------------------------
// Hue shift for dynamic background
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

// ---------------------------------------------------------------------------
// Engine types
// ---------------------------------------------------------------------------

export interface GameEvent {
    type: string;
    [key: string]: any;
}

export type EventCallback = (event: GameEvent) => void;

export interface GameEngine {
    state: any;
    particles: ParticleSystem;
    scorePopups: ScorePopupSystem;
    shake: ScreenShake;
    tick(dt: number): void;
    render(ctx: CanvasRenderingContext2D, width: number, height: number): void;
    handleKey(e: KeyboardEvent): void;
    resize(width: number, height: number): void;
    destroy(): void;
    saveGameResult(): any;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createGameEngine(wordPool?: string[]): GameEngine {
    let state = createGameState();
    const particles = new ParticleSystem();
    const scorePopups = new ScorePopupSystem();
    const shake = new ScreenShake();
    const pool = biasWordPool(commonWords, []);

    let canvasWidth = 800;
    let canvasHeight = 600;
    let startTime = 0;
    let gameOverTime = 0;
    let lastCorrectEnemyIds: string[] = [];

    // Pause/resume countdown
    let resumeCountdown = 0;
    let resumeTarget = 0;

    // Hitlag: micro time-freeze on kill for weighty feel
    let hitlagTimer = 0;
    const HITLAG_DURATION = 0.018; // 18ms

    // Chain kill: rapid successive kills within window
    let chainCount = 0;
    let chainTimer = 0;
    const CHAIN_WINDOW = 0.6; // 600ms to chain
    let lastChainTime = 0;
    let chainMultiplier = 1;

    // Power-ups
    const music = createMusicEngine();
    let enemyVariants: Map<string, VariantState> = new Map();
    // Apply difficulty modifier
    const diffMods = { easy: 0.7, normal: 1.0, hard: 1.3 };
    let powerUps: PowerUp[] = [];
    let activePowerUps: ActivePowerUp[] = [];
    let shieldCount = 0;

    // Vignette
    const VIGNETTE_STRENGTH = 0.35;

    const language = "en-US";
    const copy = getGameCopy(language);

    // --- Ticking ---

    function tick(dt: number): void {
        // Hitlag: freeze game for micro-moment on kill
        if (hitlagTimer > 0) {
            hitlagTimer -= dt;
            // Still update particles and shake during hitlag for visual juice
            particles.update(dt);
            scorePopups.update(dt);
            shake.update(dt);
            return;
        }

        // Chain kill timer decay
        if (chainTimer > 0) {
            chainTimer -= dt;
            if (chainTimer <= 0) {
                chainCount = 0;
                chainMultiplier = 1;
            }
        }

        if (state.mode === "resuming") {
            resumeCountdown -= dt;
            if (resumeCountdown <= 0) {
                state = transitionGameMode(state, "resume");
                resumeCountdown = 0;
            }
            return;
        }

        if (state.mode !== "playing") return;

        state = processSpawns(state, dt);
        const physResult = updateGameState(state, dt, canvasHeight);
        state = physResult.state;

        physResult.events.forEach((evt: any) => {
            if (evt.type === "enemy_leaked") {
                const leaked = state.enemies.find((e: any) => e.id === evt.enemyId);
                if (leaked) {
                    // Shield absorbs leak
                    if (shieldCount > 0) {
                        shieldCount--;
                        particles.emit({ x: leaked.x, y: canvasHeight - 20, count: 20, color: "#0a84ff", speed: 3, size: 3, glow: 0.8, trail: true });
                        shake.trigger(4);
                        // Restore the life that was lost
                        state = { ...state, lives: Math.min(state.maxLives, state.lives + 1), enemiesLeaked: state.enemiesLeaked - 1 };
                    } else {
                        particles.emit({ x: leaked.x, y: canvasHeight - 20, count: 15, color: COLORS.error, spread: Math.PI, speed: 2, gravity: 3, turbulence: 0.5, trail: true });
                        shake.trigger(8);
                    }
                }
            }
            if (evt.type === "wave_complete") {
                // Confetti burst from all directions
                const confettiColors = [COLORS.normal, COLORS.fast, COLORS.warning, COLORS.success, "#ff6b6b", "#c084fc"];
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    const cx = canvasWidth / 2 + Math.cos(angle) * canvasWidth * 0.3;
                    const cy = canvasHeight / 2 + Math.sin(angle) * canvasHeight * 0.3;
                    particles.emit({
                        x: cx, y: cy, count: 15,
                        color: confettiColors[i % confettiColors.length],
                        speed: 5, size: 4, gravity: 3, turbulence: 1.2, trail: true, trailLength: 12, lifetime: 1.5
                    });
                }
                shake.trigger(8);

                // Bomb screen flash handled by bomb power-up
                const hasBombFlash = activePowerUps.some(ap => ap.type === "bomb");

                if (evt.perfect) {
                    state = { ...state, perfectWaves: state.perfectWaves + 1 };
                    // Extra golden burst for perfect wave
                    for (let i = 0; i < 6; i++) {
                        particles.emit({
                            x: Math.random() * canvasWidth, y: Math.random() * canvasHeight,
                            count: 25, color: "#ffd700", speed: 5, size: 5, gravity: -2, turbulence: 1.0, trail: true, trailLength: 15, lifetime: 2.0
                        });
                    }
                    shake.trigger(12);
                }

                // Update music theme based on wave
                const waveNum = state.wave;
                if (waveNum >= 13) music.setTheme("black-hole");
                else if (waveNum >= 6) music.setTheme("nebula");

                // Extended delay for wave clear celebration
                setTimeout(() => {
                    if (state.mode === "playing") {
                        state = startWave(state, pool, { canvasWidth, canvasHeight });
                        // Spawn variant enemies for this wave
                        const variantType = shouldSpawnVariant(state.wave - 1);
                        if (variantType && state.enemies) {
                            const aliveEnemies = state.enemies.filter((e: any) => e.alive);
                            if (aliveEnemies.length > 0) {
                                // Pick a random alive enemy to be variant
                                const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                                enemyVariants.set(target.id, createVariantState(variantType));
                            }
                        }
                    }
                }, 2000);
            }
            if (evt.type === "game_over") {
                gameOverTime = performance.now();
                shake.trigger(12);
                initGameOver(buildGameResult(state));
                music.setPlaying(false);
                const result = buildGameResult(state);
                saveGameRecord({ score: result.score, wave: result.wave, wpm: result.wpm, accuracy: result.accuracy, maxCombo: result.maxCombo, date: new Date().toLocaleDateString() });
            }
        });

        particles.update(dt);
        scorePopups.update(dt);
        shake.update(dt);
        music.setCombo(state.combo);
        // Update enemy variants
        enemyVariants.forEach((v, id) => { enemyVariants.set(id, updateVariant(v, dt)); });
        updateAchievementModal(performance.now());
        updateTutorial(performance.now());
        updateComboFx(dt, state.combo);
        updateHud(dt, state.score, state.lives, state.combo);

        // Update power-ups
        powerUps = updatePowerUps(powerUps, dt);

        // Update active power-up durations
        activePowerUps = activePowerUps.map(ap => ({ ...ap, remaining: ap.remaining - dt })).filter(ap => ap.remaining > 0);

        // Slow power-up effect: reduce enemy speed
        const hasSlow = activePowerUps.some(ap => ap.type === "slow");
        if (hasSlow && state.enemies) {
            state = {
                ...state,
                enemies: state.enemies.map((e: any) => e.alive ? { ...e, speed: e.speed * 0.4 } : e)
            };
        }
    }

    // --- Rendering ---

    function render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        const time = performance.now();
        canvasWidth = width;
        canvasHeight = height;

        const offset = shake.getOffset();
        ctx.save();
        ctx.translate(offset.x, offset.y);

        drawBackground(ctx, width, height, time);

        if (state.mode === "idle") {
            renderIdle(ctx, width, height, time);
        } else if (state.mode === "playing" || state.mode === "resuming") {
            renderPlaying(ctx, width, height, time);
        } else if (state.mode === "paused") {
            renderPaused(ctx, width, height, time);
        } else if (state.mode === "gameover") {
            drawGameOverScreen(ctx, width, height, time);
        }

        // Achievement modal overlay (renders on top of everything)
        renderAchievementModal(ctx, width, height, time);
        renderSettingsPanel(ctx, width, height, time);
        renderTutorial(ctx, width, height, time);
        renderStatsHistory(ctx, width, height, time);

        ctx.restore();
    }

    function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        const theme = getBlendedTheme(state.wave);
        drawThemedBackground(ctx, w, h, time, theme, state.combo);

        // Theme-aware ambient particles
        if (Math.random() < theme.particleRate) {
            particles.emit({
                x: Math.random() * w, y: Math.random() * h,
                count: 1, color: theme.particleColor, speed: 0.3, size: 1.5, lifetime: 2, glow: 0.3
            });
        }
    }

    function renderIdle(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        particles.update(1 / 60);
        particles.draw(ctx);

        // Fade-out when starting
        const startAnimDuration = 500;
        const startProgress = startTime ? Math.min(1, (time - startTime) / startAnimDuration) : 0;
        if (startProgress > 0 && startProgress < 1) {
            ctx.save();
            const scale = 1 - startProgress * 0.5;
            ctx.translate(w / 2, h / 2);
            ctx.scale(scale, scale);
            ctx.translate(-w / 2, -h / 2);
            ctx.globalAlpha = 1 - startProgress;
        }

        drawGlassPanel(ctx, w / 2 - 180, h / 2 - 100, 360, 160, 20);

        ctx.font = "700 42px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(copy.title, w / 2, h / 2 - 50);

        ctx.font = "400 16px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textSecondary;
        ctx.fillText(copy.subtitle, w / 2, h / 2);

        const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;
        ctx.globalAlpha *= pulse;
        ctx.font = "500 14px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.fillText(copy.start, w / 2, h / 2 + 50);

        if (startProgress > 0 && startProgress < 1) ctx.restore();
    }

    function renderPlaying(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        // Enemies with variant overlays
        state.enemies.filter((e: any) => e.alive).forEach((e: any) => {
            drawEnemyAppleStyle(ctx, e, time, lastCorrectEnemyIds.includes(e.id));
            const variant = enemyVariants.get(e.id);
            if (variant) {
                const enemySize = e.type === "boss" ? 32 : e.type === "tank" ? 24 : 18;
                drawVariantOverlay(ctx, variant, e.x, e.y, enemySize, time);
                drawVariantBadge(ctx, variant, e.x, e.y, enemySize);
            }
        });

        // Combo visual effects
        drawComboFx(ctx, w, h, time, state.combo);

        // Draw power-ups
        powerUps.filter(pu => pu.alive).forEach(pu => drawPowerUp(ctx, pu, time));

        particles.draw(ctx);
        scorePopups.draw(ctx);
        drawHUD(ctx, w, h, time);

        // Wave incoming overlay
        if (state.wave > 0 && state.waveQueue.length > 0 && state.nextSpawnIndex < state.waveQueue.length) {
            const elapsed = time - (state.waveStartTime || time);
            if (elapsed < 2000) {
                const alpha = Math.max(0, 1 - elapsed / 2000);
                const scale = 1 + (1 - alpha) * 0.5;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(w / 2, h / 2);
                ctx.scale(scale, scale);
                drawGlassPanel(ctx, -120, -30, 240, 60, 12);
                ctx.font = "600 20px -apple-system, SF Pro Display, system-ui, sans-serif";
                ctx.fillStyle = COLORS.text;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(copy.waveIncoming.replace("{wave}", String(state.wave)), 0, 0);
                ctx.restore();
            }
        }

        // Resume countdown overlay
        if (state.mode === "resuming") {
            const seconds = Math.ceil(resumeCountdown);
            const frac = resumeCountdown - Math.floor(resumeCountdown);
            const scale = 1 + (1 - frac) * 0.5;

            // Dim overlay
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0, 0, w, h);

            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.min(1, frac * 2);

            drawGlassPanel(ctx, -60, -60, 120, 120, 20);

            ctx.font = "700 48px -apple-system, SF Pro Display, system-ui, sans-serif";
            ctx.fillStyle = COLORS.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(seconds), 0, 0);

            ctx.restore();
        }
    }

    function renderPaused(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        // Draw enemies dimmed
        state.enemies.filter((e: any) => e.alive).forEach((e: any) => {
            ctx.globalAlpha = 0.2;
            drawEnemyAppleStyle(ctx, e, time);
            ctx.globalAlpha = 1;
        });

        drawHUD(ctx, w, h, time);

        // Blur overlay
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, w, h);

        // Pause menu
        renderPauseMenu(ctx, w, h, time);
    }

    function drawGameOverScreen(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        renderGameOver(ctx, w, h, time);
    }

    // --- HUD ---

    function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        drawEnhancedHud(ctx, w, h, time, state, copy);
    }

    // --- Enemy Drawing ---

    function drawEnemyAppleStyle(ctx: CanvasRenderingContext2D, enemy: any, time: number, isPotentialMatch = false): void {
        const typeConfig = getEnemyTypeConfig(enemy.type);
        const baseColor = (COLORS as any)[enemy.type] || COLORS.normal;
        const glowColor = (COLORS as any)[enemy.type + "Glow"] || COLORS.normalGlow;

        const size = enemy.type === "boss" ? 32 : enemy.type === "tank" ? 24 : enemy.type === "fast" ? 18 : 18;
        const wobble = Math.sin(time * 0.002 + enemy.x * 0.01) * 2;

        const spawnDuration = 300;
        const spawnProgress = Math.min(1, (time - (enemy.spawnTime || 0)) / spawnDuration);
        const scale = spawnProgress < 1 ? 0.5 + 0.5 * Math.sin(spawnProgress * Math.PI / 2) : 1;

        const flashDuration = 150;
        const flashProgress = Math.min(1, (time - (enemy.lastCorrectTime || 0)) / flashDuration);
        const flashAlpha = flashProgress < 1 ? 0.8 * (1 - flashProgress) : 0;

        ctx.save();
        ctx.translate(enemy.x + wobble, enemy.y);
        ctx.scale(scale, scale);

        if (isPotentialMatch) {
            const pulse = Math.sin(time * 0.005) * 0.5 + 0.5;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 10 + pulse * 10;
        }
        if (flashAlpha > 0) ctx.globalAlpha += flashAlpha;

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20 + Math.sin(time * 0.003) * 5;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.3, baseColor);
        gradient.addColorStop(1, baseColor + "80");
        ctx.fillStyle = gradient;

        if (enemy.type === "boss") {
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.bezierCurveTo(size * 0.5, -size * 0.5, size * 0.5, size * 0.5, 0, size);
            ctx.bezierCurveTo(-size * 0.5, size * 0.5, -size * 0.5, -size * 0.5, 0, -size);
            ctx.fill();
        } else if (enemy.type === "tank") {
            ctx.beginPath();
            ctx.roundRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4, 6);
            ctx.fill();
        } else if (enemy.type === "fast") {
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.bezierCurveTo(size * 0.3, -size * 0.3, size * 0.8, size * 0.3, 0, size * 0.7);
            ctx.bezierCurveTo(-size * 0.8, size * 0.3, -size * 0.3, -size * 0.3, 0, -size);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;

        // HP bar
        if (typeConfig.hp > 1) {
            const barW = size * 2;
            const barH = 4;
            const barY = -size - 12;
            drawGlassPanel(ctx, -barW / 2, barY, barW, barH, 2);
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.roundRect(-barW / 2, barY, barW * (enemy.hp / enemy.maxHp), barH, 2);
            ctx.fill();
        }

        // Progress ring
        const progress = enemy.word.length > 0 ? (enemy.typed || "").length / enemy.word.length : 0;
        drawProgressRing(ctx, 0, 0, size + 4, progress, baseColor);

        // Word rendering
        ctx.font = "500 14px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const word = enemy.word;
        const typed = enemy.typed || "";

        if (typed.length > 0) {
            const typedWidth = ctx.measureText(typed).width;
            const fullWidth = ctx.measureText(word).width;
            const startX = -fullWidth / 2;
            ctx.fillStyle = COLORS.success;
            ctx.shadowColor = COLORS.success;
            ctx.shadowBlur = 8;
            ctx.textAlign = "left";
            ctx.fillText(typed, startX, size + 16);
            ctx.fillStyle = COLORS.text;
            ctx.shadowBlur = 0;
            ctx.fillText(word.slice(typed.length), startX + typedWidth, size + 16);
        } else {
            ctx.fillStyle = COLORS.text;
            ctx.fillText(word, 0, size + 16);
        }

        ctx.restore();
    }

    // --- Keyboard Input ---

    function handleKey(e: KeyboardEvent): void {
        if (state.mode === "idle") {
            if (e.key === "Escape") return;
        if (e.key === "h" || e.key === "H") { openStats(); return; }
            initSound();
            showTutorial();
            music.start();
            const s = getSettings();
            music.setVolume(s.volume / 100);
            music.setPlaying(s.musicEnabled);
            startTime = performance.now();
            state = transitionGameMode(state, "start");
            state = startWave(state, pool, { canvasWidth, canvasHeight, kps: state.kps });
            return;
        }

        if (e.key === "Escape") {
            if (state.mode === "playing") {
                state = transitionGameMode(state, "pause");
                music.setPaused(true);
                resetPauseMenu();
                return;
            }
        }

        // Pause menu navigation
        if (state.mode === "paused" && !isSettingsOpen()) {
            const action = handlePauseMenuKey(e);
            if (action === "continue") {
                resumeCountdown = 3;
                music.setPaused(false);
                state = { ...state, mode: "resuming" as any };
            } else if (action === "settings") {
                openSettings();
            } else if (action === "quit") {
                state = createGameState();
                startTime = 0;
                gameOverTime = 0;
                powerUps = [];
                activePowerUps = [];
                shieldCount = 0;
                enemyVariants.clear();
                clearGameOver();
                clearAchievementQueue();
                music.stop();
            }
            return;
        }

        // Stats history input
        if (isStatsOpen()) { handleStatsKey(e); return; }

        // Tutorial overlay consumes first key
        if (isTutorialShowing()) {
            handleTutorialKey();
            return;
        }



        // Settings input consumes all keys when open
        if (isSettingsOpen()) {
            handleSettingsKey(e);
            return;
        }

        if (state.mode === "gameover" && (e.key === "r" || e.key === "R")) {
            state = createGameState();
            startTime = 0;
            gameOverTime = 0;
            powerUps = [];
            activePowerUps = [];
            shieldCount = 0;
            clearGameOver();
            clearAchievementQueue();
            enemyVariants.clear();
            resetComboFx();
            resetHud();
            return;
        }

        if (state.mode === "playing" && e.key.length === 1) {
            e.preventDefault();

            // Process power-up input first (only if no active enemy)
            const puResult = processPowerUpInput(powerUps, e.key, state.activeEnemyId);
            powerUps = puResult.powerUps;

            // Handle collected power-ups
            puResult.collected.forEach((puType: PowerUpType) => {
                const config = getPowerUpConfig(puType);
                playKillSound();
                shake.trigger(5);
                particles.emit({ x: canvasWidth / 2, y: canvasHeight / 2, count: 30, color: config.color, speed: 5, size: 4, glow: 0.9, trail: true, trailLength: 12 });

                if (puType === "bomb") {
                    // Bomb: destroy all alive enemies
                    const aliveEnemies = state.enemies.filter((en: any) => en.alive);
                    aliveEnemies.forEach((en: any) => {
                        particles.emit({ x: en.x, y: en.y, count: 15, color: COLORS.error, speed: 4, size: 3, gravity: 2, trail: true });
                        state = { ...state, score: state.score + 50, enemiesDefeated: state.enemiesDefeated + 1 };
                    });
                    state = { ...state, enemies: state.enemies.map((en: any) => ({ ...en, alive: false })) };
                    shake.trigger(15);
                    scorePopups.emit({ x: canvasWidth / 2, y: canvasHeight / 2, text: "BOMB!", color: COLORS.error, fontSize: 32 });
                } else if (puType === "shield") {
                    shieldCount++;
                    activePowerUps.push({ type: "shield", remaining: config.duration, duration: config.duration });
                    scorePopups.emit({ x: canvasWidth / 2, y: canvasHeight / 2 - 30, text: "SHIELD", color: config.color, fontSize: 24 });
                } else {
                    activePowerUps.push({ type: puType, remaining: config.duration, duration: config.duration });
                    scorePopups.emit({ x: canvasWidth / 2, y: canvasHeight / 2 - 30, text: config.label, color: config.color, fontSize: 24 });
                }
            });

            // If power-up consumed the input, skip enemy input
            if (puResult.collected.length > 0 || puResult.events.length > 0) {
                // Check if the input also matched a power-up word start
                const matchedPu = puResult.events.some((ev: any) => ev.type === "powerup_collected");
                if (matchedPu) return; // Power-up consumed the input
            }

            const result = processInput(state, e.key);
            state = result.state;

            result.events.forEach((evt: any) => {
                if (evt.type === "enemy_killed") {
                    // Check if enemy has active shield (absorb the kill)
                    const killedVariant = enemyVariants.get(evt.enemyId);
                    if (killedVariant && killedVariant.type === "shielded" && killedVariant.shieldActive) {
                        // Shield absorbed the hit - enemy survives
                        state = {
                            ...state,
                            enemies: state.enemies.map((en: any) => en.id === evt.enemyId ? { ...en, alive: true, typed: "" } : en),
                            enemiesDefeated: state.enemiesDefeated - 1,
                        };
                        enemyVariants.set(evt.enemyId, { ...killedVariant, shieldActive: false });
                        shake.trigger(4);
                        particles.emit({ x: 0, y: 0, count: 15, color: "#0a84ff", speed: 3, size: 3, glow: 0.8 });
                        return; // skip normal kill effects
                    }
                    playKillSound();
                    playComboSound(state.combo);
                    const enemy = state.enemies.find((en: any) => en.id === evt.enemyId);
                    if (enemy) {
                        const color = (COLORS as any)[enemy.type] || COLORS.normal;
                        // Scale particles by chain count
                        const chainBonus = Math.min(chainCount + 1, 5);
                        particles.emit({ x: enemy.x, y: enemy.y, count: 20 + chainBonus * 5, color, speed: 3 + chainBonus, size: 3 + chainBonus * 0.5, gravity: 2, turbulence: 0.5 + chainCount * 0.1, trail: true, trailLength: 6 + chainBonus * 2 });
                        particles.emit({ x: enemy.x, y: enemy.y, count: 8 + chainBonus * 2, color: "#ffffff", speed: 2, size: 2, lifetime: 0.4 });
                        shake.trigger(4 + chainBonus * 2);
                        triggerComboFlash(state.combo);

                        // Chain kill tracking
                        const now = Date.now();
                        if (now - lastChainTime < CHAIN_WINDOW * 1000) {
                            chainCount++;
                            chainMultiplier = 1 + chainCount * 0.25;
                        } else {
                            chainCount = 1;
                            chainMultiplier = 1;
                        }
                        lastChainTime = now;
                        chainTimer = CHAIN_WINDOW;

                        // Score popup with chain indicator
                        // Double score power-up
                        const hasDouble = activePowerUps.some(ap => ap.type === "double");
                        const baseScore = evt.score;
                        const chainScore = Math.round(baseScore * chainMultiplier * (hasDouble ? 2 : 1));
                        const chainLabel = chainCount > 1 ? " x" + chainCount : "";
                        scorePopups.emit({ x: enemy.x, y: enemy.y - 20, text: "+" + chainScore + chainLabel, color: chainCount > 3 ? "#ff6b6b" : chainCount > 1 ? COLORS.warning : COLORS.warning, fontSize: 18 + chainCount * 2 });

                        // Trigger hitlag
                        hitlagTimer = HITLAG_DURATION * (1 + chainCount * 0.3);

                        // Splitter variant: spawn 2 mini enemies on death
                        const killedVariant2 = enemyVariants.get(evt.enemyId);
                        if (killedVariant2 && killedVariant2.type === "splitter") {
                            for (let si = 0; si < 2; si++) {
                                const splitId = "split-" + Date.now().toString(36) + "-" + si;
                                state.enemies.push({
                                    id: splitId, type: "normal", word: "go"[si] || "go",
                                    x: enemy.x + (si === 0 ? -20 : 20), y: enemy.y,
                                    speed: enemy.speed * 1.3, hp: 1, maxHp: 1, scoreMultiplier: 1,
                                    alive: true, typed: "", spawnTime: Date.now(),
                                });
                            }
                            particles.emit({ x: enemy.x, y: enemy.y, count: 20, color: "#bf5af2", speed: 4, size: 3, trail: true });
                        }

                        // Power-up drop chance
                        const dropType = shouldDropPowerUp(enemy.type);
                        if (dropType) {
                            powerUps.push(createPowerUp(dropType, enemy.x, enemy.y));
                            particles.emit({ x: enemy.x, y: enemy.y, count: 8, color: getPowerUpConfig(dropType).color, speed: 2, size: 2, lifetime: 0.5, glow: 0.8 });
                        }
                    }
                }
                if (evt.type === "char_correct") {
                    playClickSound();
                    const activeEnemy = state.enemies.find((en: any) => en.id === evt.enemyId);
                    if (activeEnemy) {
                        particles.emit({ x: activeEnemy.x, y: activeEnemy.y, count: 3, color: COLORS.success, speed: 1, size: 2, lifetime: 0.3 });
                    }
                }
                if (evt.type === "char_error") {
                    playErrorSound();
                    shake.trigger(2);
                }
                if (evt.type === "char_miss") {
                    lastCorrectEnemyIds = evt.matches || [];
                }
                if (evt.type === "achievement_unlocked") {
                    enqueueAchievement(evt.achievementId);
                }
            });
        }
    }

    function resize(w: number, h: number): void {
        canvasWidth = w;
        canvasHeight = h;
    }

    function destroy(): void {
        particles.clear();
        scorePopups.clear();
        powerUps = [];
        activePowerUps = [];
        music.stop();
    }

    return {
        get state() { return state; },
        particles,
        scorePopups,
        shake,
        tick,
        render,
        handleKey,
        resize,
        destroy,
        saveGameResult() { return buildGameResult(state); },
    };
}
