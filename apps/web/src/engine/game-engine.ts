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
    calculatePerformanceScore, isBreathingWave,
    getDailyChallenge, getDailyBestScore, saveDailyScore,
    getBossPhase, getBossPhaseSpeedMultiplier, getBossPhaseColor,
    checkBossPhaseTransition,
} from "@typemaster/domain";
import { ParticleSystem, ScreenShake } from "./particle-system";
import { ScorePopupSystem } from "./score-popup";
import { COLORS } from "../components/game/colors";
import { drawGlassPanel, drawProgressRing } from "../components/game/draw-helpers";
import { initSound, playClickSound, playKillSound, playErrorSound, playComboSound, playChainSound, playPowerUpSound, playShieldBreakSound, playWaveClearSound, playGameOverSound, playAchievementSound, setSfxEnabled, playCountdownBeep, playCountdownGo, playBossPhaseSound, playBreathingWaveSound, playComboMilestoneSound, playThemeTransitionSound, playBossCounterSound, playBossWeakPointSound, playChainAttackSound } from "../components/game/sound-engine";
import { getBlendedTheme, drawThemedBackground } from "./environment-theme";
import { GenerativeVisualSystem } from "./generative-visuals";
import { initGameOver, renderGameOver, clearGameOver } from "./game-over";
import { showWaveComplete, isWaveCompleteShowing, renderWaveComplete } from "./wave-complete";
import { addGameResult, saveReplay } from "../services/storage/game-save";
import { updateGameplayAura, renderGameplayAura, renderDangerIndicator, triggerTypingRipple, resetGameplayAura } from "./gameplay-reactive-aura";
import { spawnDeathEffect, updateDeathEffects, renderDeathEffects } from "./enemy-death-fx";
import { onCorrectKey, onWrongKey, onComboMilestone, updateKeystrokeImpact, renderImpactRings, getEnemyShakeOffset, getEnemyErrorFlash, renderComboMilestones } from "./keystroke-impact";
import { initKeystrokeSound, playKeystrokeNote, renderSoundVisualizer } from "./keystroke-sound";
import { onCorrectKeystroke, onIncorrectKeystroke, updateRhythm, renderRhythmBar, renderFlowAura, renderSpeedRing, resetRhythm, getFlowLevel } from "./typing-rhythm-visual";
import { createMusicEngine } from "./music-engine";
import { DynamicMusicManager } from "./dynamic-music";
import { PerformanceManager } from "./performance-optimizer";
import { enqueueAchievement, updateAchievementModal, renderAchievementModal, clearAchievementQueue } from "./achievement-modal";
import { openSettings, closeSettings, isSettingsOpen, handleSettingsKey, renderSettingsPanel, getSettings } from "./settings-panel";
import { showTutorial, isTutorialShowing, handleTutorialKey, updateTutorial, renderTutorial } from "./tutorial-overlay";
import { handlePauseMenuKey, renderPauseMenu, resetPauseMenu, updateLiveStats } from "./pause-menu";
import { openAchievementPage, closeAchievementPage, isAchievementPageOpen, handleAchievementPageKey, renderAchievementPage } from "./achievement-page";
import { openLeaderboard, closeLeaderboard, isLeaderboardOpen, handleLeaderboardKey, renderLeaderboard, saveToLeaderboard } from "./leaderboard";
import { initGamepad, pollGamepad, gamepadToKey, gamepadVibrate, isGamepadConnected } from "./gamepad";
import { openThemePage, closeThemePage, isThemePageOpen, handleThemePageKey, renderThemePage } from "./theme-page";
import { getThemeColors } from "@typemaster/domain";
import { findChainMatch, getChainHint } from "@typemaster/domain";
import { RhythmEngine } from "@typemaster/domain";
import { BossBattleState, BOSS_PHASES } from "@typemaster/domain";
import { generateRun, selectNode, completeCurrentNode, advanceToNextAct, getAvailableChoices, getCurrentNode, getEncounterConfig, getRunStats, NODE_TYPES, EVENTS, processEvent, restAction, purchaseUpgrade, getShopOffers, UPGRADE_DEFS } from "@typemaster/domain";
import { renderRunMap, createRunMapState, handleRunMapKey } from "./run-map";
import { renderEncounter, createEncounterState, handleEncounterKey } from "./encounter-ui";
import { renderBossBattleUI } from "./boss-battle-ui";
import { renderRhythmReward } from "./rhythm-reward-visual";
import { triggerComboFlash, updateComboFx, drawComboFx, resetComboFx } from "./combo-fx";
import { updateHud, drawEnhancedHud, resetHud } from "./hud-overlay";
import { openStats, isStatsOpen, handleStatsKey, renderStatsHistory, saveGameRecord } from "./stats-history";
import { drawTouchIndicator, isMobile, renderTouchRipples } from "./touch-input";
import { updateTracker, drawAchievementTracker, resetTracker, trackPowerUp } from "./achievement-tracker";
import { updateTracker as updateAutoTracker, resetTracker as resetAutoTracker } from "./achievement-tracker-auto";
import { shouldSpawnVariant, createVariantState, updateVariant, processShieldInput, drawVariantOverlay, drawVariantBadge } from "./enemy-variant";
import type { VariantState, VariantType } from "./enemy-variant";
import { shouldDropPowerUp, createPowerUp, updatePowerUps, processPowerUpInput, drawPowerUp, drawActivePowerUps, getPowerUpConfig } from "./power-up";
import type { PowerUp, ActivePowerUp, PowerUpType } from "./power-up";
import { TypingFeedbackManager } from "./typing-feedback";
import { GameHubManager } from "./game-hub";
import { BattleVfxManager } from "./battle-vfx";
import { initRhythmEngine, onTypingKeystroke, getTypingIntensity, startAmbient, stopAmbient, cleanup as cleanupRhythm } from "../components/game/rhythm-engine";
import { startTutorial, isTutorialActive, updateTutorialState, renderTutorialOverlay, skipTutorial, getLastReward } from "./interactive-tutorial";

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
    initGamepad();

    const particles = new ParticleSystem();
    const scorePopups = new ScorePopupSystem();
    const shake = new ScreenShake();

    const typingFeedback = new TypingFeedbackManager();

    const gameHub = new GameHubManager();
    const battleVfx = new BattleVfxManager();
    const pool = biasWordPool(commonWords, []);

    let canvasWidth = 800;
    let canvasHeight = 600;
    let startTime = 0;
    let gameOverTime = 0;
    let lastCorrectEnemyIds: string[] = [];
    let dailyChallenge: any = null; // Active daily challenge config
    let fpsFrames = 0;
    let fpsLastTime = 0;
    let fpsDisplay = 60;

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
    const dynamicMusic = new DynamicMusicManager();
    const perfManager = new PerformanceManager();
    const rhythmEngine = new RhythmEngine();
    const bossBattle = new BossBattleState();
    // Run system state
    let currentRun: any = null;
    function applyRunUpgrades() {
        if (!currentRun) return;
        const extraLives = getUpgradeStacks("extra_life");
        if (extraLives > 0) {
            currentRun = { ...currentRun, maxLives: 5 + extraLives, lives: Math.min(currentRun.lives, 5 + extraLives) };
        }
    }
    let runMapState: any = null;
    let encounterConfig: any = null;
    let wavesInEncounter = 0;
    let wavesTarget = 0;
    let encounterState: any = null;

    // Upgrade effect helpers
    function getUpgradeStacks(id) {
        if (!currentRun) return 0;
        const u = currentRun.upgrades.find(u => u.id === id);
        return u ? u.stacks : 0;
    }
    function hasUpgrade(id) { return getUpgradeStacks(id) > 0; }
    const genVisuals = new GenerativeVisualSystem();
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
        // Gamepad polling
        const gpEvents = pollGamepad();
        for (const evt of gpEvents) {
            const key = gamepadToKey(evt);
            if (key) {
                const fakeEvent = new KeyboardEvent('keydown', { key, bubbles: true });
                handleKey(fakeEvent);
            }
        }
        // FPS tracking
        fpsFrames++;
        const now = performance.now();
        if (now - fpsLastTime >= 1000) {
            fpsDisplay = Math.round(fpsFrames * 1000 / (now - fpsLastTime));
            fpsFrames = 0;
            fpsLastTime = now;
        }
        // Update generative visuals (always, even during hitlag)
        genVisuals.update(dt);
        // run_map tick: animate map
        if (state.mode === "run_map" && runMapState) { runMapState.animTime += dt * 1000; }

        // Boss battle update
        const activeBoss = state.enemies.find((e: any) => e.alive && e.type === "boss");
        if (activeBoss) {
            const bossEvent = bossBattle.update(dt, activeBoss.hp, activeBoss.maxHp);
            if (bossEvent && bossEvent.type === "counter_attack") {
                state = { ...state, lives: Math.max(0, state.lives - bossEvent.damage) };
                shake.trigger(12);
                particles.emit({ x: canvasWidth / 2, y: canvasHeight, count: 30, color: "#ef4444", speed: 5, size: 4, gravity: -2, turbulence: 0.8, trail: true });
                playErrorSound();
                haptic(50);
            }
        }

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
            const prevSec = Math.ceil(resumeCountdown);
            resumeCountdown -= dt;
            const curSec = Math.ceil(resumeCountdown);
            if (curSec < prevSec && curSec > 0) playCountdownBeep();
            if (resumeCountdown <= 0) {
                playCountdownGo();
                state = transitionGameMode(state, "resume");
                resumeCountdown = 0;
                rhythmEngine.reset();
                bossBattle.reset();
                resetAutoTracker();
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
                    // Combo shield upgrade: auto-shield when combo >= 10
                    const comboShieldActive = hasUpgrade("combo_shield") && state.combo >= 10;
                    if (comboShieldActive) {
                        state = { ...state, combo: Math.max(0, state.combo - 5) };
                        particles.emit({ x: leaked.x, y: canvasHeight - 20, count: 20, color: "#0a84ff", speed: 3, size: 3, glow: 0.8, trail: true });
                        shake.trigger(4);
                        state = { ...state, lives: Math.min(state.maxLives, state.lives + 1), enemiesLeaked: state.enemiesLeaked - 1 };
                    } else if (shieldCount > 0) {
                        shieldCount--;
                        particles.emit({ x: leaked.x, y: canvasHeight - 20, count: 20, color: "#0a84ff", speed: 3, size: 3, glow: 0.8, trail: true });
                        shake.trigger(4);
                        // Restore the life that was lost
                        state = { ...state, lives: Math.min(state.maxLives, state.lives + 1), enemiesLeaked: state.enemiesLeaked - 1 }; haptic(50);
                    } else {
                        particles.emit({ x: leaked.x, y: canvasHeight - 20, count: 15, color: COLORS.error, spread: Math.PI, speed: 2, gravity: 3, turbulence: 0.5, trail: true });
                        shake.trigger(8);
                playWaveClearSound(); if (isBreathingWave(state.wave)) playBreathingWaveSound(); haptic([20, 40, 20]);
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
                genVisuals.triggerBurst(canvasWidth / 2, canvasHeight / 2, '#4ade80', 2);

                // Bomb screen flash handled by bomb power-up
                const hasBombFlash = activePowerUps.some(ap => ap.type === "bomb");

                // Show wave complete celebration
                const waveKills = state.enemiesDefeated;
                const waveCombo = state.combo;
                showWaveComplete(state.wave, waveKills, !!evt.perfect, waveCombo, state.score);

                // Vampiric keys upgrade: heal on perfect wave
                if (evt.perfect && hasUpgrade("vampiric_keys")) {
                    state = { ...state, lives: Math.min(state.maxLives, state.lives + 1) };
                    particles.emit({ x: canvasWidth / 2, y: canvasHeight / 2, count: 25, color: "#ff453a", speed: 3, size: 3, glow: 0.8, trail: true });
                }

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
                if (waveNum >= 13) { music.setTheme("black-hole"); playThemeTransitionSound("black-hole"); }
                else if (waveNum >= 6) { music.setTheme("nebula"); playThemeTransitionSound("nebula"); }

                // Extended delay for wave clear celebration
                setTimeout(() => {
                    if (state.mode === "playing") {
                        { const perfScore = calculatePerformanceScore(state); state = { ...state, _performanceScore: perfScore } as any; state = startWave(state, pool, { canvasWidth, canvasHeight, performanceScore: perfScore }); }
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
                playGameOverSound();
                const result = buildGameResult(state);
                if (dailyChallenge) { saveDailyScore(dailyChallenge.date, result.score); }
                saveGameRecord({ score: result.score, wave: result.wave, wpm: result.wpm, accuracy: result.accuracy, maxCombo: result.maxCombo, date: new Date().toLocaleDateString() });
                // Save to new persistence system
                addGameResult({ score: result.score, wave: result.wave, wpm: result.wpm, maxCombo: result.maxCombo, enemiesDefeated: result.enemiesDefeated, duration: (performance.now() - startTime) / 1000, accuracy: result.accuracy });
                saveReplay({ id: "replay-" + Date.now(), date: new Date().toISOString(), score: result.score, wave: result.wave, wpm: result.wpm, accuracy: result.accuracy, maxCombo: result.maxCombo, enemiesDefeated: result.enemiesDefeated, enemiesLeaked: state.enemiesLeaked, duration: (performance.now() - startTime) / 1000, mode: "classic", rating: "", peakCombo: state.maxCombo, peakComboWave: state.wave, perfectWaves: state.perfectWaves });
            }
        });

        particles.update(dt);
        scorePopups.update(dt);
        shake.update(dt);
        typingFeedback.update(dt);
        music.setCombo(state.combo);
        // Update enemy variants
        enemyVariants.forEach((v, id) => { enemyVariants.set(id, updateVariant(v, dt)); });
        updateAchievementModal(performance.now());
        updateTutorial(performance.now());
        updateComboFx(dt, state.combo);
        updateGameplayAura(dt, state.combo, state.enemies.filter((e: any) => e.alive), canvasHeight, state.score);
        updateDeathEffects();
        updateRhythm(dt);
        updateKeystrokeImpact();
        updateHud(dt, state.score, state.lives, state.combo);
        updateTracker({ combo: state.combo, wave: state.wave, wpm: 0, score: state.score, chain: chainCount, perfectWaves: state.perfectWaves });
                    updateAutoTracker({ combo: state.combo, kills: state.enemiesDefeated, wave: state.wave, score: state.score });
                    updateAutoTracker({ combo: state.combo, kills: state.enemiesDefeated, wave: state.wave, score: state.score });

        // Update power-ups
        powerUps = updatePowerUps(powerUps, dt);

        // Update active power-up durations
        activePowerUps = activePowerUps.map(ap => ({ ...ap, remaining: ap.remaining - dt })).filter(ap => ap.remaining > 0);

        // Slow field upgrade: reduce enemy speed permanently
        const slowStacks = getUpgradeStacks("slow_field");
        if (slowStacks > 0 && state.enemies) {
            const slowMod = Math.pow(0.7, slowStacks);
            state = { ...state, enemies: state.enemies.map((e: any) => e.alive ? { ...e, speed: e.speed * slowMod } : e) };
        }

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

        // Gameplay reactive aura (danger, combo atmosphere, ripples)
        renderGameplayAura(ctx, width, height, time);

        // Typing flow aura (golden glow for consecutive correct inputs)
        renderFlowAura(ctx, width, height, time);

        if (state.mode === "encounter") {
            renderEncounter(ctx, width, height, encounterState, time);
        } else if (state.mode === "run_map") {
            renderRunMap(ctx, width, height, runMapState, time);
        } else if (state.mode === "idle") {
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
        renderAchievementPage(ctx, width, height, time);
        renderLeaderboard(ctx, width, height, time);
        renderThemePage(ctx, width, height, time);
        drawTouchIndicator(ctx, width, height, time);

        ctx.restore();
    }

    function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        const theme = getBlendedTheme(state.wave);
        const themeColors = getThemeColors();
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
        // Use Game Hub for the idle screen
        gameHub.resize(w, h);
        gameHub.update(1 / 60, time);
        gameHub.render(ctx, w, h);
    }

        function renderChainHint(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        if (!state.completedWords || state.completedWords.length === 0) return;
        const hint = getChainHint(state.completedWords);
        if (!hint) return;

        // Draw chain progress at top-center
        const x = w / 2;
        const y = 50;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Chain label
        ctx.font = "600 11px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = hint.chain.color + "cc";
        ctx.fillText(hint.chain.labelZh, x, y - 14);

        // Progress dots
        const dotSpacing = 20;
        const startX = x - ((hint.total - 1) * dotSpacing) / 2;
        for (let i = 0; i < hint.total; i++) {
            const dx = startX + i * dotSpacing;
            ctx.beginPath();
            ctx.arc(dx, y + 6, 4, 0, Math.PI * 2);
            if (i < hint.progress) {
                ctx.fillStyle = hint.chain.color;
                ctx.fill();
            } else {
                ctx.strokeStyle = hint.chain.color + "60";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Next word hint
        ctx.font = "500 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = hint.chain.color + "90";
        ctx.fillText("next: " + hint.nextWord, x, y + 20);

        ctx.restore();
    }
function renderPlaying(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        // Enemies with variant overlays
        state.enemies.filter((e: any) => e.alive).forEach((e: any) => {
            drawEnemyAppleStyle(ctx, e, time, lastCorrectEnemyIds.includes(e.id));
                // Speed ring around active enemy
                if (e.id === state.activeEnemyId) {
                    const enemySize = e.type === "boss" ? 36 : e.type === "tank" ? 28 : 20;
                    renderSpeedRing(ctx, e.x, e.y, enemySize, time);
                }
            const variant = enemyVariants.get(e.id);
            if (variant) {
                const enemySize = e.type === "boss" ? 32 : e.type === "tank" ? 24 : 18;
                drawVariantOverlay(ctx, variant, e.x, e.y, enemySize, time);
                drawVariantBadge(ctx, variant, e.x, e.y, enemySize);
            }
        });

        // Combo visual effects
        drawComboFx(ctx, w, h, time, state.combo);
        drawAchievementTracker(ctx, w, h, time);

        // Draw power-ups
        powerUps.filter(pu => pu.alive).forEach(pu => drawPowerUp(ctx, pu, time));

        particles.draw(ctx);
        scorePopups.draw(ctx);
        typingFeedback.drawBursts(ctx);
        typingFeedback.drawRhythmPulse(ctx, w, h);

        // Enemy death effects
        renderDeathEffects(ctx, time);

        // Touch ripple effects
        renderTouchRipples(ctx, time);

        // Keystroke impact rings
        renderImpactRings(ctx, time);

        // Combo milestone celebrations
        renderComboMilestones(ctx, w, h, time);

        // Wave complete overlay
        if (isWaveCompleteShowing()) {
            renderWaveComplete(ctx, w, h, time);
        }

        renderChainHint(ctx, w, h, time);
        renderRhythmReward(ctx, w, h, rhythmEngine.getRhythmScore(), rhythmEngine.getDamageMultiplier(), rhythmEngine.getStreak(), time);
        // Boss battle UI
        const bossEnemy = state.enemies.find((e: any) => e.alive && e.type === "boss");
        if (bossEnemy) {
            const bossStateObj = { ...bossBattle, _phaseConfig: BOSS_PHASES[bossBattle.phase] };
            renderBossBattleUI(ctx, w, h, bossStateObj, time);
        }
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
        updateLiveStats({
                score: state.score, wave: state.wave, combo: state.combo,
                maxCombo: state.maxCombo, lives: state.lives,
                enemiesDefeated: state.enemiesDefeated, enemiesLeaked: state.enemiesLeaked,
                accuracy: state.totalCharsTyped > 0 ? Math.round(state.totalCharsCorrect / state.totalCharsTyped * 100) : 100,
                wpm: (state as any)._performanceScore || 0, duration: startTime > 0 ? (performance.now() - startTime) / 1000 : 0,
            });
            renderPauseMenu(ctx, w, h, time);
    }

    function drawGameOverScreen(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        renderGameOver(ctx, w, h, time);
    }

    // --- HUD ---

    function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
        renderDangerIndicator(ctx, w, h);
        renderRhythmBar(ctx, w, h, time);
        renderSoundVisualizer(ctx, w, h, time);
        drawEnhancedHud(ctx, w, h, time, state, copy);
        // FPS counter (bottom-right, subtle)
        // Gamepad indicator (bottom-right, above FPS)
        if (isGamepadConnected()) {
            ctx.font = "500 9px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = "#34c759";
            ctx.globalAlpha = 0.5;
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText("GAMEPAD", w - 12, h - 20);
            ctx.globalAlpha = 1;
        }
        // Active upgrades display (top-left, above FPS)
        if (currentRun && currentRun.upgrades.length > 0) {
            const upgradeY = h - 36;
            ctx.font = "500 9px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            let ux = 12;
            for (const u of currentRun.upgrades) {
                const def = UPGRADE_DEFS.find(d => d.id === u.id);
                if (!def) continue;
                ctx.fillStyle = def.color + "aa";
                ctx.globalAlpha = 0.7;
                ctx.fillText(def.icon + (u.stacks > 1 ? "x" + u.stacks : ""), ux, upgradeY);
                ux += ctx.measureText(def.icon + (u.stacks > 1 ? "x" + u.stacks : "")).width + 8;
            }
            ctx.globalAlpha = 1;
        }

        // FPS counter
        if (fpsDisplay > 0) {
            const fpsColor = fpsDisplay >= 55 ? "#34c759" : fpsDisplay >= 30 ? "#ffcc02" : "#ff3b5c";
            ctx.font = "400 9px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = fpsColor;
            ctx.globalAlpha = 0.4;
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(fpsDisplay + " fps", w - 12, h - 8);
            ctx.globalAlpha = 1;
        }
    }

    // --- Enemy Drawing ---

    function drawEnemyAppleStyle(ctx: CanvasRenderingContext2D, enemy: any, time: number, isPotentialMatch = false): void {
        const typeConfig = getEnemyTypeConfig(enemy.type);
        const baseColor = (COLORS as any)[enemy.type] || COLORS.normal;
        const glowColor = (COLORS as any)[enemy.type + "Glow"] || COLORS.normalGlow;
        const innerColor = (COLORS as any)[enemy.type + "Inner"] || "#ffffff";

        const size = enemy.type === "boss" ? 36 : enemy.type === "tank" ? 28 : enemy.type === "fast" ? 20 : 20;
        const shakeOff = getEnemyShakeOffset(enemy.id, time);
        const errorFlash = getEnemyErrorFlash(enemy.id, time);
        const wobble = Math.sin(time * 0.002 + enemy.x * 0.01) * 2 + shakeOff.x;

        const spawnDuration = 400;
        const spawnProgress = Math.min(1, (time - (enemy.spawnTime || 0)) / spawnDuration);
        const scale = spawnProgress < 1 ? 0.3 + 0.7 * easeOutBack(spawnProgress) : 1;

        const flashDuration = 180;
        const flashProgress = Math.min(1, (time - (enemy.lastCorrectTime || 0)) / flashDuration);
        const flashAlpha = flashProgress < 1 ? 0.9 * (1 - flashProgress) : 0;

        ctx.save();
        ctx.translate(enemy.x + wobble, enemy.y + shakeOff.y);
        // Depth perspective: enemies near top are far (small), near bottom are close (large)
        const depthFactor = genVisuals.getDepthFactor(enemy.y, canvasHeight);
        const depthAlpha = genVisuals.getDepthAlpha(enemy.y, canvasHeight);
        ctx.globalAlpha *= depthAlpha;
        ctx.scale(scale * depthFactor, scale * depthFactor);

        // Generative aura
        const auraColor = (COLORS as any)[enemy.type] || COLORS.normal;
        const isActive = enemy.id === state.activeEnemyId;
        genVisuals.drawEnemyAura(ctx, 0, 0, size, auraColor, time, isActive, state.combo);

        // Potential match highlight
        if (isPotentialMatch) {
            const pulse = Math.sin(time * 0.004) * 0.4 + 0.6;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 12 + pulse * 12;
        }

        // Hit flash
        if (flashAlpha > 0) {
            ctx.globalAlpha = Math.min(1, ctx.globalAlpha + flashAlpha * 0.5);
        }

        // Draw by enemy type
        if (enemy.type === "boss") {
            drawBossEnemy(ctx, size, time, baseColor, glowColor, innerColor, enemy._bossPhase || 1);
        } else if (enemy.type === "tank") {
            drawTankEnemy(ctx, size, time, baseColor, glowColor, innerColor);
        } else if (enemy.type === "fast") {
            drawFastEnemy(ctx, size, time, baseColor, glowColor, innerColor);
        } else {
            drawNormalEnemy(ctx, size, time, baseColor, glowColor, innerColor);
        }

        ctx.shadowBlur = 0;

        // HP bar for multi-hp enemies
        if (typeConfig.hp > 1) {
            const barW = size * 2.2;
            const barH = 4;
            const barY = -size - 14;
            drawGlassPanel(ctx, -barW / 2, barY, barW, barH, 2);
            const hpRatio = enemy.hp / enemy.maxHp;
            const hpColor = hpRatio > 0.5 ? baseColor : hpRatio > 0.25 ? COLORS.warning : COLORS.error;
            ctx.fillStyle = hpColor;
            ctx.beginPath();
            ctx.roundRect(-barW / 2, barY, barW * hpRatio, barH, 2);
            ctx.fill();
        }

        // Progress ring
        const progress = enemy.word.length > 0 ? (enemy.typed || "").length / enemy.word.length : 0;
        if (progress > 0) {
            drawProgressRing(ctx, 0, 0, size + 6, progress, baseColor);
        }

        // Word rendering with typing feedback
        const word = enemy.word;
        const typed = enemy.typed || "";
        const wordY = size + 18;
        
        typingFeedback.drawWord(ctx, enemy.id, word, typed, 0, wordY, 13);

        ctx.restore();
    }

    // --- Enemy Type Renderers ---

    function drawNormalEnemy(ctx: CanvasRenderingContext2D, size: number, time: number, baseColor: string, glowColor: string, innerColor: string): void {
        // Smooth sphere with soft glow and breathing animation
        const breathe = Math.sin(time * 0.003) * 0.08 + 1.0;
        const s = size * breathe;

        // Outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25 + Math.sin(time * 0.004) * 8;

        // Sphere gradient
        const grad = ctx.createRadialGradient(-s * 0.25, -s * 0.25, 0, 0, 0, s);
        grad.addColorStop(0, innerColor);
        grad.addColorStop(0.4, baseColor);
        grad.addColorStop(1, baseColor + "60");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight (specular)
        ctx.shadowBlur = 0;
        const specGrad = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, -s * 0.1, -s * 0.1, s * 0.5);
        specGrad.addColorStop(0, "rgba(255,255,255,0.5)");
        specGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = specGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFastEnemy(ctx: CanvasRenderingContext2D, size: number, time: number, baseColor: string, glowColor: string, innerColor: string): void {
        // Sharp diamond with vibration and motion trail
        const vibrate = Math.sin(time * 0.015) * 1.5;
        const stretch = 1.0 + Math.sin(time * 0.008) * 0.05;

        ctx.save();
        ctx.translate(vibrate, 0);
        ctx.scale(1, stretch);

        // Motion trail (trailing afterglow)
        for (let i = 3; i > 0; i--) {
            const alpha = 0.06 * (4 - i);
            ctx.fillStyle = baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.save();
            ctx.translate(i * 4, i * 3);
            drawDiamond(ctx, size * 0.7);
            ctx.fill();
            ctx.restore();
        }

        // Main diamond
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;

        const grad = ctx.createRadialGradient(0, -size * 0.2, 0, 0, 0, size * 0.9);
        grad.addColorStop(0, innerColor);
        grad.addColorStop(0.5, baseColor);
        grad.addColorStop(1, baseColor + "50");
        ctx.fillStyle = grad;
        drawDiamond(ctx, size * 0.7);
        ctx.fill();

        // Sharp highlight line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(size * 0.15, -size * 0.1);
        ctx.stroke();

        ctx.restore();
    }

    function drawDiamond(ctx: CanvasRenderingContext2D, r: number): void {
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.6, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.6, 0);
        ctx.closePath();
    }

    function drawTankEnemy(ctx: CanvasRenderingContext2D, size: number, time: number, baseColor: string, glowColor: string, innerColor: string): void {
        // Heavy hexagon with solid presence and subtle bounce
        const bounce = Math.abs(Math.sin(time * 0.002)) * 2;

        ctx.save();
        ctx.translate(0, bounce);

        // Shadow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 30;

        // Hexagon
        const grad = ctx.createRadialGradient(-size * 0.2, -size * 0.2, 0, 0, 0, size * 0.95);
        grad.addColorStop(0, innerColor);
        grad.addColorStop(0.35, baseColor);
        grad.addColorStop(1, baseColor + "70");
        ctx.fillStyle = grad;
        drawHexagon(ctx, size * 0.85);
        ctx.fill();

        // Thick border
        ctx.shadowBlur = 0;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.5;
        drawHexagon(ctx, size * 0.85);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Center cross pattern (armor texture)
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, 0);
        ctx.lineTo(size * 0.3, 0);
        ctx.moveTo(0, -size * 0.3);
        ctx.lineTo(0, size * 0.3);
        ctx.stroke();

        ctx.restore();
    }

    function drawHexagon(ctx: CanvasRenderingContext2D, r: number): void {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    function drawBossEnemy(ctx: CanvasRenderingContext2D, size: number, time: number, baseColor: string, glowColor: string, innerColor: string, bossPhase: number = 1): void {
        // Multi-layered command center with rotating rings
        const rotation = time * 0.001;
        const pulse = Math.sin(time * 0.003) * 0.1 + 1.0;
        
        // Phase-based visual intensity
        const phaseIntensity = 1 + (bossPhase - 1) * 0.3;
        const phaseGlowBoost = bossPhase >= 2 ? 10 : 0;
        const phaseRingSpeed = bossPhase >= 3 ? 2.5 : 1.0;

        // Aura field
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 40 + phaseGlowBoost + Math.sin(time * 0.005) * 15;

        // Outer rotating ring
        ctx.save();
        ctx.rotate(rotation * phaseRingSpeed);
        ctx.strokeStyle = baseColor + "40";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.2, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();

        // Middle rotating ring (counter)
        ctx.save();
        ctx.rotate(-rotation * 1.3 * phaseRingSpeed);
        ctx.strokeStyle = baseColor + "60";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.95, 0, Math.PI * 1.8);
        ctx.stroke();
        ctx.restore();

        // Core body - irregular shape
        const grad = ctx.createRadialGradient(-size * 0.15, -size * 0.15, 0, 0, 0, size * pulse * phaseIntensity);
        grad.addColorStop(0, innerColor);
        grad.addColorStop(0.3, baseColor);
        grad.addColorStop(0.7, baseColor + "80");
        grad.addColorStop(1, baseColor + "30");
        ctx.fillStyle = grad;

        // Star-like shape
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 / points) * i + rotation * 0.5;
            const r = i % 2 === 0 ? size * 0.75 : size * 0.55;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Inner glow
        ctx.shadowBlur = 0;
        const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
        innerGrad.addColorStop(0, "rgba(255,255,255,0.6)");
        innerGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Corner accent dots
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + rotation * 2;
            const dx = Math.cos(angle) * size * 0.5;
            const dy = Math.sin(angle) * size * 0.5;
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // Easing function: overshoot for spawn
    // Haptic feedback via Vibration API (mobile)
    function haptic(pattern: number | number[]) {
        try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
        if (isGamepadConnected()) { gamepadVibrate(0.5, typeof pattern === "number" ? pattern : 100); }
    }

        function easeOutBack(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    // --- Keyboard Input ---

    function handleKey(e: KeyboardEvent): void {
        if (state.mode === "idle") {
            if (e.key === "Escape") return;
            
            // Route through Game Hub
            const hubAction = gameHub.handleKey(e.key);
            
            if (hubAction === null) {
                // Game Hub consumed the key (navigation, etc.)
                return;
            }
            
            // Handle Game Hub actions
            switch (hubAction) {
                case 'play':
                    // Start classic mode
                    initSound();
                    showTutorial();
                    music.start();
                    const s = getSettings();
                    music.setVolume(s.volume / 100);
                    music.setPlaying(s.musicEnabled);
                    setSfxEnabled(s.sfxEnabled);
                    startTime = performance.now();
                    resetGameplayAura();
                    resetRhythm();
                    state = transitionGameMode(state, "start");
                    { const perfScore = calculatePerformanceScore(state); state = { ...state, _performanceScore: perfScore } as any; state = startWave(state, pool, { canvasWidth, canvasHeight, kps: state.kps, performanceScore: perfScore }); }
                    return;
                    
                case 'leaderboard':
                    openLeaderboard();
                    return;
                    
                case 'achievements':
                    openAchievementPage();
                    return;
                    
                case 'settings':
                    openSettings();
                    return;
                    
                default:
                    // Handle challenge:modeId format
                    if (hubAction.startsWith('challenge:')) {
                        dailyChallenge = getDailyChallenge();
                        initSound();
                        showTutorial();
                        music.start();
                        const s2 = getSettings();
                        music.setVolume(s2.volume / 100);
                        music.setPlaying(s2.musicEnabled);
                        setSfxEnabled(s2.sfxEnabled);
                        startTime = performance.now();
                        state = transitionGameMode(state, "start");
                        state = { ...state, _dailyChallenge: dailyChallenge } as any;
                        { const perfScore = calculatePerformanceScore(state); state = { ...state, _performanceScore: perfScore } as any; state = startWave(state, pool, { canvasWidth, canvasHeight, kps: state.kps, performanceScore: perfScore }); }
                        return;
                    }
                    return;
            }
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
            } else if (action === "restart") {
                state = createGameState();
                startTime = 0;
                gameOverTime = 0;
                powerUps = [];
                activePowerUps = [];
                shieldCount = 0;
                enemyVariants.clear();
                clearGameOver(); resetRhythm();
                clearAchievementQueue();
                resetComboFx();
                resetHud();
                resetTracker();
                music.stop();
                initSound();
                music.start();
                const s = getSettings();
                music.setVolume(s.volume / 100);
                music.setPlaying(s.musicEnabled);
                state = transitionGameMode(state, "start");
                { const perfScore = calculatePerformanceScore(state); state = { ...state, _performanceScore: perfScore } as any; state = startWave(state, pool, { canvasWidth, canvasHeight, kps: state.kps, performanceScore: perfScore }); }
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

        // Achievement page input
        if (isAchievementPageOpen()) { handleAchievementPageKey(e); return; }

        // Leaderboard input
        if (isLeaderboardOpen()) { handleLeaderboardKey(e); return; }

        // Theme page input
        if (isThemePageOpen()) { handleThemePageKey(e); return; }

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
            resetTracker();
            return;
        }

        if (state.mode === "encounter") {
            if (!encounterState) return;
            const encResult = handleEncounterKey(e.key, encounterState);
            encounterState = encResult;
            if (encResult.action === "leave" || encResult.action === "rested" || encResult.action === "event_done" || encResult.action === "purchased") {
                currentRun = encResult.run;
                if (encResult.action === "leave" || encResult.action === "purchased") {
                    // Return to map (shop allows multiple purchases)
                    if (encResult.action === "leave") {
                        runMapState = createRunMapState(currentRun);
                        state = { ...state, mode: "run_map" } as any;
                    }
                } else {
                    // rest/event: auto-advance to map
                    currentRun = completeCurrentNode(currentRun, {});
                    runMapState = createRunMapState(currentRun);
                    state = { ...state, mode: "run_map" } as any;
                }
            }
            return;
        }

        if (state.mode === "run_map") {
            if (!runMapState) return;
            const mapResult = handleRunMapKey(e.key, runMapState);
            runMapState = mapResult;
            if (mapResult.action === "select" && currentRun) {
                currentRun = selectNode(currentRun, mapResult.nodeId);
                const currentNode = getCurrentNode(currentRun);
                const nodeType = currentNode.type;
                // Route non-combat nodes to encounter UI
                if (nodeType === "shop" || nodeType === "rest" || nodeType === "event") {
                    encounterState = createEncounterState(nodeType, currentRun);
                    state = { ...state, mode: "encounter" } as any;
                } else {
                    runMapState = createRunMapState(currentRun);
                    const actConfig = currentRun.acts[currentRun.currentAct].config;
                    encounterConfig = getEncounterConfig(currentNode, actConfig);
                    wavesInEncounter = 0;
                    wavesTarget = encounterConfig.waveCount;
                    state = transitionGameMode(state, "start");
                    resetGameplayAura();
                    resetRhythm();
                    showTutorial();
                    { const perfScore = calculatePerformanceScore(state); state = { ...state, _performanceScore: perfScore } as any; state = startWave(state, pool, { canvasWidth, canvasHeight, kps: state.kps, performanceScore: perfScore }); }
                }
            }
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
            // Detect wrong key: if no kill event and active enemy exists, it's an error
            if (state.activeEnemyId && !result.events.some((evt: any) => evt.type === "enemy_killed")) {
                onWrongKey(state.activeEnemyId);
            }
            state = result.state;

            // Trigger typing ripple on the active enemy
            if (state.activeEnemyId) {
                const activeEnemy = state.enemies.find((e: any) => e.id === state.activeEnemyId);
                if (activeEnemy) {
                    triggerTypingRipple(activeEnemy.x, activeEnemy.y, true);
                    genVisuals.triggerRipple(activeEnemy.x, activeEnemy.y, (COLORS as any)[activeEnemy.type] || COLORS.normal, 0.3 + state.combo * 0.05);
                }
            }

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
                        playShieldBreakSound();
                        shake.trigger(4);
                        particles.emit({ x: 0, y: 0, count: 15, color: "#0a84ff", speed: 3, size: 3, glow: 0.8 });
                        return; // skip normal kill effects
                    }
                    const enemy = state.enemies.find((en: any) => en.id === evt.enemyId);
                    playKillSound(enemy?.type); haptic(15); onCorrectKeystroke(); playKeystrokeNote(e.key, true); onCorrectKey(enemy.x, enemy.y, state.combo); rhythmEngine.onKeystroke(performance.now());
                    playComboSound(state.combo);
                    if (enemy) {
                        typingFeedback.onWordComplete(evt.enemyId, enemy.word, enemy.x, enemy.y, (COLORS as any)[enemy.type] || COLORS.normal);
                        const color = (COLORS as any)[enemy.type] || COLORS.normal;
                        // Scale particles by chain count
                        const chainBonus = Math.min(chainCount + 1, 5);
                        particles.emit({ x: enemy.x, y: enemy.y, count: 20 + chainBonus * 5, color, speed: 3 + chainBonus, size: 3 + chainBonus * 0.5, gravity: 2, turbulence: 0.5 + chainCount * 0.1, trail: true, trailLength: 6 + chainBonus * 2 });
                        genVisuals.triggerBurst(enemy.x, enemy.y, color, 0.5 + chainCount * 0.2);
                        genVisuals.triggerRipple(enemy.x, enemy.y, color, 0.5 + chainCount * 0.15);
                        particles.emit({ x: enemy.x, y: enemy.y, count: 8 + chainBonus * 2, color: "#ffffff", speed: 2, size: 2, lifetime: 0.4 });
                        shake.trigger(4 + chainBonus * 2);
                        triggerComboFlash(state.combo); onComboMilestone(state.combo); if (state.combo % 5 === 0 && state.combo > 0) { playComboMilestoneSound(state.combo); haptic([10, 30, 10]); }
                        if (chainCount > 1) playChainSound(chainCount);

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
                        let rhythmMult = rhythmEngine.getDamageMultiplier();
                        // Boss battle modifiers
                        if (enemy.type === "boss") {
                            // Shield blocks damage
                            if (bossBattle.isShieldActive()) {
                                const shieldBroken = bossBattle.onShieldWordTyped();
                                if (!shieldBroken) {
                                    // Shield absorbs the hit - no kill, just shield damage
                                    particles.emit({ x: enemy.x, y: enemy.y, count: 8, color: "#f59e0b", speed: 2, size: 2, lifetime: 0.3 });
                                    scorePopups.emit({ x: enemy.x, y: enemy.y - 25, text: "SHIELD", color: "#f59e0b", fontSize: 12 });
                                    return; // Don't kill the boss
                                } else {
                                    // Shield broken!
                                    particles.emit({ x: enemy.x, y: enemy.y, count: 40, color: "#f59e0b", speed: 6, size: 4, gravity: 1, trail: true });
                                    scorePopups.emit({ x: enemy.x, y: enemy.y - 30, text: "SHIELD BROKEN!", color: "#f59e0b", fontSize: 18 });
                                    shake.trigger(10);
                                }
                            }
                            // Weak point bonus
                            if (bossBattle.isWeakPointActive()) {
                                rhythmMult *= bossBattle.getDamageMultiplier();
                                particles.emit({ x: enemy.x, y: enemy.y, count: 20, color: "#ef4444", speed: 4, size: 3, trail: true });
                                scorePopups.emit({ x: enemy.x, y: enemy.y - 35, text: "WEAK POINT x3!", color: "#ef4444", fontSize: 16 });
                            }
                        }
                        const chainScore = Math.round(baseScore * chainMultiplier * rhythmMult * (hasDouble ? 2 : 1));
                        const chainLabel = chainCount > 1 ? " x" + chainCount : "";
                        const rhythmTag = rhythmMult >= 1.3 ? " [R]" : "";
                        scorePopups.emit({ x: enemy.x, y: enemy.y - 20, text: "+" + chainScore + chainLabel + rhythmTag, color: chainCount > 3 ? "#ff6b6b" : chainCount > 1 ? COLORS.warning : COLORS.warning, fontSize: 18 + chainCount * 2 });

                        // Trigger hitlag
                        // Word chain detection
                        if (state.completedWords && state.completedWords.length >= 2) {
                            const chainMatch = findChainMatch(state.completedWords);
                            if (chainMatch) {
                                const chainScore = chainMatch.bonus * 100;
                                state.enemies.filter((en) => en.alive).forEach((en) => {
                                    const dx = en.x - enemy.x;
                                    const dy = en.y - enemy.y;
                                    const dist = Math.sqrt(dx * dx + dy * dy);
                                    if (dist < 300 && en.id !== enemy.id) {
                                        particles.emit({ x: en.x, y: en.y, count: 12, color: chainMatch.color, speed: 4, size: 3, gravity: 1, trail: true });
                                        scorePopups.emit({ x: en.x, y: en.y - 15, text: "CHAIN!", color: chainMatch.color, fontSize: 14 });
                                    }
                                });
                                genVisuals.triggerBurst(enemy.x, enemy.y, chainMatch.color, 1.5);
                                scorePopups.emit({ x: enemy.x, y: enemy.y - 40, text: chainMatch.labelZh + " +" + chainScore, color: chainMatch.color, fontSize: 20 });
                                shake.trigger(10);
                            }
                        }
hitlagTimer = HITLAG_DURATION * (1 + chainCount * 0.3);
                        
                        // Boss phase transition check
                        if (enemy && enemy.type === "boss" && enemy.alive) {
                            const newPhase = checkBossPhaseTransition(enemy);
                            if (newPhase) {
                                // Update boss phase on the enemy
                                state.enemies = state.enemies.map((en: any) => 
                                    en.id === enemy.id ? { ...en, _bossPhase: newPhase } : en
                                );
                                // Phase transition effects
                                shake.trigger(10);
                                playBossPhaseSound(newPhase);
                                const phaseColor = getBossPhaseColor(newPhase);
                                particles.emit({ x: canvasWidth / 2, y: canvasHeight / 2, count: 40, color: phaseColor, speed: 6, size: 4, glow: 0.9, trail: true, trailLength: 15 });
                                particles.emit({ x: enemy.x, y: enemy.y, count: 30, color: "#ffffff", speed: 5, size: 3, lifetime: 0.8 });
                                scorePopups.emit({ x: canvasWidth / 2, y: canvasHeight / 2 - 40, text: "PHASE " + newPhase + "!", color: phaseColor, fontSize: 28 }); haptic([30, 20, 30, 20, 30]);
                                hitlagTimer = HITLAG_DURATION * 3; // Extra hitlag for phase transition
                            }
                        }

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
                        typingFeedback.onCharCorrect(evt.enemyId, (activeEnemy.typed || '').length - 1, activeEnemy.typed.slice(-1), activeEnemy.x, activeEnemy.y);
                    }
                }
                if (evt.type === "char_error") {
                    playErrorSound();
                    shake.trigger(2);
                    typingFeedback.onCharError(evt.enemyId, 0, 0);
                }
                if (evt.type === "char_miss") {
                    lastCorrectEnemyIds = evt.matches || [];
                    rhythmEngine.onError();
                }
                if (evt.type === "achievement_unlocked") {
                    enqueueAchievement(evt.achievementId);
                    playAchievementSound();
                }
            });
        }
    }

    function resize(w: number, h: number): void {
        canvasWidth = w;
        canvasHeight = h;
        gameHub.resize(w, h);
        genVisuals.resize(w, h);
    }
    function destroy(): void {
        particles.clear();
        scorePopups.clear();
        typingFeedback.clear();
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














































