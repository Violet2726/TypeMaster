'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    createGameState,
    transitionGameMode,
    processInput,
    updateGameState,
    startWave,
    processSpawns,
    buildGameResult,
    getGameCopy,
    getEnemyTypeConfig,
    getComboMultiplier,
    commonWords,
    biasWordPool
} from '@typemaster/domain';
import '../../src/styles/game-page.css';
import { useGameStore } from '../features/game/state/game-store';
import { appendSession } from '../services/storage/sessions-repo';
import { COLORS } from '../components/game/colors';
import { initSound, playClickSound, playKillSound, playErrorSound, playComboSound } from '../components/game/sound-engine';
import { drawProgressRing, drawGlassPanel } from '../components/game/draw-helpers';


// ------------------------------------------------------------------------------
// Apple Design Language Colors
// ------------------------------------------------------------------------------

const COLORS = {
    bg: '#000000',
    bgGradientStart: '#0a0a0c',
    bgGradientEnd: '#1a1a2e',
    
    // Enemy colors with gradients
    normal: '#0a84ff',
    normalGlow: 'rgba(10, 132, 255, 0.4)',
    fast: '#ffd60a',
    fastGlow: 'rgba(255, 214, 10, 0.4)',
    tank: '#ff9f0a',
    tankGlow: 'rgba(255, 159, 10, 0.4)',
    boss: '#ff453a',
    bossGlow: 'rgba(255, 69, 58, 0.4)',
    
    // UI colors
    text: '#f5f5f7',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textTertiary: 'rgba(255, 255, 255, 0.3)',
    
    // Feedback colors
    success: '#32d74b',
    error: '#ff453a',
    warning: '#ffd60a',
    
    // Glass effect
    glassBg: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassHighlight: 'rgba(255, 255, 255, 0.15)'
};

function shiftHue(hex: string, degrees: number) {
    if (!hex || degrees === 0) return hex;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Simple hue shift approximation by rotating RGB channels slightly
    // A proper HSL rotation would be better but this is cheaper for canvas
    const shift = degrees / 360;
    const temp = r;
    r = Math.round(r * (1 - shift) + g * shift);
    g = Math.round(g * (1 - shift) + b * shift);
    b = Math.round(b * (1 - shift) + temp * shift);
    
    return `#` + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

// ------------------------------------------------------------------------------
// Particle System
// ------------------------------------------------------------------------------

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    decay: number;
}

class ParticleSystem {
    particles: Particle[] = [];
    
    emit(x: number, y: number, count: number, color: string, options: { spread?: number; speed?: number; size?: number } = {}) {
        const spread = options.spread || Math.PI * 2;
        const speed = options.speed || 3;
        const size = options.size || 3;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * spread;
            const vel = speed * (0.5 + Math.random() * 0.5);
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * vel,
                vy: Math.sin(angle) * vel,
                life: 1,
                maxLife: 0.5 + Math.random() * 0.5,
                color,
                size: size * (0.5 + Math.random() * 0.5),
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    update(dt: number) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= p.decay;
            return p.life > 0;
        });
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life * 0.8;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

// ------------------------------------------------------------------------------
// Screen Shake
// ------------------------------------------------------------------------------

class ScreenShake {
    intensity = 0;
    decay = 0.9;
    
    trigger(amount: number) {
        this.intensity = Math.min(this.intensity + amount, 15);
    }
    
    update() {
        this.intensity *= this.decay;
        if (this.intensity < 0.1) this.intensity = 0;
    }
    
    getOffset() {
        return {
            x: (Math.random() - 0.5) * this.intensity * 2,
            y: (Math.random() - 0.5) * this.intensity * 2
        };
    }
}

// ------------------------------------------------------------------------------
// Drawing Helpers
// ------------------------------------------------------------------------------

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, combo: number = 0) {
    // Gradient background
    const hueShift = Math.min(30, combo) * 2; // Shift hue up to 60 degrees at max combo
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, shiftHue(COLORS.bgGradientStart, hueShift));
    gradient.addColorStop(1, shiftHue(COLORS.bgGradientEnd, hueShift));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grid effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Animated stars with depth
    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
        const depth = (i % 3 + 1) / 3;
        const x = (i * 137.5 + time * 0.005 * depth) % width;
        const y = (i * 97.3 + time * 0.002 * depth) % height;
        const alpha = 0.1 + depth * 0.2 + Math.sin(time * 0.001 + i) * 0.05;
        const size = 0.5 + depth * 1;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGlassPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number = 12) {
    // Glass background
    ctx.fillStyle = COLORS.glassBg;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    // Glass border
    ctx.strokeStyle = COLORS.glassBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Glass highlight
    const highlightGradient = ctx.createLinearGradient(x, y, x, y + height * 0.3);
    highlightGradient.addColorStop(0, COLORS.glassHighlight);
    highlightGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height * 0.3, [radius, radius, 0, 0]);
    ctx.fill();
}

function drawEnemyAppleStyle(ctx: CanvasRenderingContext2D, enemy: any, time: number, isPotentialMatch: boolean = false) {
    const typeConfig = getEnemyTypeConfig(enemy.type);
    const baseColor = COLORS[enemy.type as keyof typeof COLORS] || COLORS.normal;
    const glowColor = COLORS[`${enemy.type}Glow` as keyof typeof COLORS] || COLORS.normalGlow;
    
    const size = enemy.type === 'boss' ? 32 : enemy.type === 'tank' ? 24 : 18;
    const wobble = Math.sin(time * 0.002 + enemy.x * 0.01) * 2;
    
    // Spawn Animation
    const spawnDuration = 300; // ms
    const spawnProgress = Math.min(1, (time - (enemy.spawnTime || 0)) / spawnDuration);
    const scale = spawnProgress < 1 ? 0.5 + 0.5 * Math.sin(spawnProgress * Math.PI / 2) : 1;
    
    // Flash Effect
    const flashDuration = 150; // ms
    const flashProgress = Math.min(1, (time - (enemy.lastCorrectTime || 0)) / flashDuration);
    const flashAlpha = flashProgress < 1 ? 0.8 * (1 - flashProgress) : 0;
    
    ctx.save();
    ctx.translate(enemy.x + wobble, enemy.y);
    ctx.scale(scale, scale);
    
    // Potential match highlight
    if (isPotentialMatch) {
        const pulse = Math.sin(time * 0.005) * 0.5 + 0.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10 + pulse * 10;
    }
    ctx.globalAlpha += flashAlpha;
    
    // Outer glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 + Math.sin(time * 0.003) * 5;
    
    // Gradient fill
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(1, baseColor + '80');
    
    ctx.fillStyle = gradient;
    
    // Shape based on type with smooth curves
    if (enemy.type === 'boss') {
        // Rounded diamond
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.bezierCurveTo(size * 0.5, -size * 0.5, size * 0.5, size * 0.5, 0, size);
        ctx.bezierCurveTo(-size * 0.5, size * 0.5, -size * 0.5, -size * 0.5, 0, -size);
        ctx.fill();
    } else if (enemy.type === 'tank') {
        // Rounded rectangle
        ctx.beginPath();
        ctx.roundRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4, 6);
        ctx.fill();
    } else if (enemy.type === 'fast') {
        // Rounded triangle
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.bezierCurveTo(size * 0.3, -size * 0.3, size * 0.8, size * 0.3, 0, size * 0.7);
        ctx.bezierCurveTo(-size * 0.8, size * 0.3, -size * 0.3, -size * 0.3, 0, -size);
        ctx.fill();
    } else {
        // Circle with gradient
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
    
    // HP bar with glass effect
    if (typeConfig.hp > 1) {
        const barWidth = size * 2;
        const barHeight = 4;
        const barY = -size - 12;
        
        drawGlassPanel(ctx, -barWidth / 2, barY, barWidth, barHeight, 2);
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-barWidth / 2, barY, barWidth * (enemy.hp / enemy.maxHp), barHeight, 2);
        ctx.fill();
    }
    
    // Progress Ring
    const progress = enemy.word.length > 0 ? (enemy.typed || '').length / enemy.word.length : 0;
    drawProgressRing(ctx, 0, 0, size + 4, progress, baseColor);
    
    // Progress Ring
    const progress = enemy.word.length > 0 ? (enemy.typed || '').length / enemy.word.length : 0;
    drawProgressRing(ctx, 0, 0, size + 4, progress, baseColor);
    
    // Word with Apple typography
    ctx.font = '500 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const word = enemy.word;
    const typed = enemy.typed || '';
    
    if (typed.length > 0) {
        const typedWidth = ctx.measureText(typed).width;
        const fullWidth = ctx.measureText(word).width;
        const startX = -fullWidth / 2;
        
        // Typed portion in green with glow
        ctx.fillStyle = COLORS.success;
        ctx.shadowColor = COLORS.success;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'left';
        ctx.fillText(typed, startX, size + 16);
        
        // Remaining portion
        ctx.fillStyle = COLORS.text;
        ctx.shadowBlur = 0;
        ctx.fillText(word.slice(typed.length), startX + typedWidth, size + 16);
    } else {
        ctx.fillStyle = COLORS.text;
        ctx.fillText(word, 0, size + 16);
    }
    
    ctx.restore();
}

function drawHUDAppleStyle(ctx: CanvasRenderingContext2D, state: any, copy: any, width: number, time: number) {
    ctx.save();
    
    // Top bar glass panel
    drawGlassPanel(ctx, 20, 16, width - 40, 48, 16);
    
    // Score
    ctx.font = '600 18px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${copy.score} ${state.score}`, 40, 40);
    
    // Wave
    ctx.fillStyle = COLORS.textSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(`${copy.wave} ${state.wave}`, width / 2, 40);
    
    // Lives as hearts
    ctx.textAlign = 'right';
    let hearts = '';
    for (let i = 0; i < state.maxLives; i++) {
        hearts += i < state.lives ? '❤️' : '🤍';
    }
    ctx.fillText(hearts, width - 40, 40);
    
    // KPS indicator
    if (state.kps > 0) {
        ctx.save();
        ctx.font = '400 12px -apple-system, "SF Pro Text", system-ui, sans-serif';
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(${Math.round(state.kps * 10) / 10} kps, width / 2, 70);
        ctx.restore();
    }
    
    // Combo indicator
    if (state.combo >= 3) {
        const comboScale = 1 + Math.sin(time * 0.005) * 0.1;
        ctx.save();
        ctx.translate(width / 2, 80);
        ctx.scale(comboScale, comboScale);
        
        drawGlassPanel(ctx, -60, -12, 120, 24, 12);
        
        ctx.font = '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
        ctx.fillStyle = COLORS.warning;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const mult = getComboMultiplier(state.combo);
        ctx.fillText(`${copy.combo} ${state.combo} (×${mult})`, 0, 0);
        
        ctx.restore();
    }
    
    // Active input display
    if (state.typedInput) {
        drawGlassPanel(ctx, width / 2 - 80, 100, 160, 32, 8);
        ctx.font = '500 16px "SF Mono", "Cascadia Mono", monospace';
        ctx.fillStyle = COLORS.success;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.typedInput, width / 2, 116);
    }
    
    ctx.restore();
}

// ------------------------------------------------------------------------------
// GamePage Component
// ------------------------------------------------------------------------------

export default function GamePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef(createGameState());
    const particlesRef = useRef(new ParticleSystem());
    const shakeRef = useRef(new ScreenShake());
    const animFrameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const gameOverTimeRef = useRef<number>(0);
    const potentialMatchesRef = useRef<string[]>([]);
    const achievementRef = useRef<{id: string, time: number} | null>(null);
    const lastTimeRef = useRef(0);
    const [, setUiState] = useState('idle');
    const language = 'en-US';
    const copy = getGameCopy(language);
    const { skillProfile, keyboardHotspots } = useGameStore();
    const wordPoolRef = useRef(biasWordPool(commonWords, keyboardHotspots?.zones || []));
    
    // Save game result function
    const saveGameResult = useCallback((gameState: any) => {
        const result = buildGameResult(gameState);
        const sessionId = 'raid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        appendSession({
            id: sessionId,
            config: { mode: 'words', wordCount: 0, durationSeconds: 0, includePunctuation: false, includeNumbers: false, source: 'builtin', aiTemplate: 'daily', difficulty: 'medium' },
            result: {
                wpm: result.wpm,
                rawWpm: result.wpm,
                accuracy: result.accuracy,
                consistency: 0,
                correctChars: result.totalCharsCorrect,
                incorrectChars: result.totalCharsTyped - result.totalCharsCorrect,
                extraChars: 0,
                missedChars: 0,
                durationSeconds: result.durationSeconds,
                completedAt: new Date().toISOString(),
                errors: 0,
                topErrorChars: [],
                topErrorWords: [],
                errorCharStats: [],
                errorWordStats: []
            },
            trainingMeta: {
                type: 'raid' as const,
                title: 'Typing Raid',
                score: result.score,
                wave: result.wave,
                maxCombo: result.maxCombo,
                enemiesDefeated: result.enemiesDefeated,
                perfectWaves: result.perfectWaves,
                livesRemaining: result.livesRemaining
            }
        });
    }, []);
    
    // Expose testing hooks
    useEffect(() => {
        (window as any).render_game_to_text = function () {
            const s = stateRef.current;
            return JSON.stringify({
                mode: s.mode,
                score: s.score,
                wave: s.wave,
                combo: s.combo,
                maxCombo: s.maxCombo,
                lives: s.lives,
                enemiesDefeated: s.enemiesDefeated,
                enemiesLeaked: s.enemiesLeaked,
                enemiesTotal: s.enemiesTotal,
                activeEnemyId: s.activeEnemyId,
                typedInput: s.typedInput,
                enemies: s.enemies.filter((e: any) => e.alive).map((e: any) => ({
                    id: e.id,
                    type: e.type,
                    word: e.word,
                    x: Math.round(e.x),
                    y: Math.round(e.y),
                    typed: e.typed
                }))
            });
        };
        
        (window as any).advanceTime = function (ms: number) {
            const steps = Math.max(1, Math.round(ms / (1000 / 60)));
            for (let i = 0; i < steps; i++) {
                tick(1 / 60);
            }
            renderFrame();
        };
        
        return () => {
            delete (window as any).render_game_to_text;
            delete (window as any).advanceTime;
        };
    }, []);
    
    const tick = useCallback((dt: number) => {
        let state = stateRef.current;
        const canvas = canvasRef.current;
        if (!canvas || state.mode !== 'playing') return;
        
        const canvasHeight = canvas.height;
        
        state = processSpawns(state, dt);
        
        const physResult = updateGameState(state, dt, canvasHeight);
        state = physResult.state;
        
        physResult.events.forEach((event: any) => {
            if (event.type === 'enemy_leaked') {
                const leakedEnemy = state.enemies.find((e: any) => e.id === event.enemyId);
                if (leakedEnemy) {
                    // Leak particles
                    particlesRef.current.emit(leakedEnemy.x, canvasHeight - 20, 15, COLORS.error, { spread: Math.PI, speed: 2 });
                    shakeRef.current.trigger(8);
                }
            }
            if (event.type === 'wave_complete') {
                if (event.perfect) {
                    state = { ...state, perfectWaves: state.perfectWaves + 1 };
                    // Perfect wave celebration
                    for (let i = 0; i < 5; i++) {
                        particlesRef.current.emit(
                            Math.random() * canvas.width,
                            Math.random() * canvas.height,
                            20,
                            COLORS.warning,
                            { speed: 4 }
                        );
                    }
                    shakeRef.current.trigger(5);
                }
                setTimeout(() => {
                    if (stateRef.current.mode === 'playing') {
                        stateRef.current = startWave(stateRef.current, wordPoolRef.current, {
                            canvasWidth: canvasRef.current ? canvasRef.current.width : 800,
                            canvasHeight: canvasRef.current ? canvasRef.current.height : 600
                        });
                    }
                }, 1500);
            }
            if (event.type === 'game_over') {
                setUiState('gameover');
                gameOverTimeRef.current = performance.now();
                saveGameResult(stateRef.current);
                shakeRef.current.trigger(12);
            }
        });
        
        // Update particles and shake
        particlesRef.current.update(dt);
        shakeRef.current.update();
        
        stateRef.current = state;
    }, [saveGameResult]);
    
    const renderFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        const state = stateRef.current;
        const time = performance.now();
        
        // Apply screen shake
        const shakeOffset = shakeRef.current.getOffset();
        ctx.save();
        ctx.translate(shakeOffset.x, shakeOffset.y);
        
        // Draw background
        drawBackground(ctx, width, height, time, state.combo);
        
        if (state.mode === 'idle') {
            // Apple-style idle screen
            ctx.save();
            
            // Start animation
            const startAnimDuration = 500; // ms
            const startProgress = startTimeRef.current ? Math.min(1, (time - startTimeRef.current) / startAnimDuration) : 0;
            if (startProgress > 0) {
                const scale = 1 - startProgress * 0.5;
                const alpha = 1 - startProgress;
                ctx.translate(width / 2, height / 2);
                ctx.scale(scale, scale);
                ctx.translate(-width / 2, -height / 2);
                ctx.globalAlpha = alpha;
            }
            
            // Title with glass effect
            drawGlassPanel(ctx, width / 2 - 180, height / 2 - 100, 360, 160, 20);
            
            ctx.font = '700 42px -apple-system, "SF Pro Display", system-ui, sans-serif';
            ctx.fillStyle = COLORS.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(copy.title, width / 2, height / 2 - 50);
            
            ctx.font = '400 16px -apple-system, "SF Pro Text", system-ui, sans-serif';
            ctx.fillStyle = COLORS.textSecondary;
            ctx.fillText(copy.subtitle, width / 2, height / 2);
            
            // Pulsing start prompt
            const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.font = '500 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
            ctx.fillStyle = COLORS.textTertiary;
            ctx.fillText(copy.start, width / 2, height / 2 + 50);
            ctx.globalAlpha = 1;
            
            ctx.restore();
            ctx.restore();
            return;
        }
        
        if (state.mode === 'paused') {
            // Draw enemies dimmed
            state.enemies.filter((e: any) => e.alive).forEach((e: any) => {
                ctx.globalAlpha = 0.3;
                drawEnemyAppleStyle(ctx, e, time);
                ctx.globalAlpha = 1;
            });
            
            drawHUDAppleStyle(ctx, state, copy, width, time);
            
            // Pause overlay with glass effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, width, height);
            
            drawGlassPanel(ctx, width / 2 - 150, height / 2 - 60, 300, 120, 20);
            
            ctx.font = '600 28px -apple-system, "SF Pro Display", system-ui, sans-serif';
            ctx.fillStyle = COLORS.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(copy.paused, width / 2, height / 2 - 20);
            
            ctx.font = '400 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
            ctx.fillStyle = COLORS.textSecondary;
            ctx.fillText(copy.resume, width / 2, height / 2 + 20);
            
            ctx.restore();
            return;
        }
        
        // Draw enemies with Apple style
        state.enemies.filter((e: any) => e.alive).forEach((e: any) => {
            drawEnemyAppleStyle(ctx, e, time, potentialMatchesRef.current.includes(e.id));
        });
        
        // Draw particles
        particlesRef.current.draw(ctx);
        
        // Draw HUD
        drawHUDAppleStyle(ctx, state, copy, width, time);
        
        // Wave Preview UI
        if (state.wavePreview && Object.keys(state.wavePreview).length > 0) {
            ctx.save();
            const previewX = width - 200;
            const previewY = 80;
            
            drawGlassPanel(ctx, previewX, previewY, 180, 60 + Object.keys(state.wavePreview).length * 24, 12);
            
            ctx.font = '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
            ctx.fillStyle = COLORS.textSecondary;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(copy.waveIncoming.replace('{wave}', String(state.wave + 1)), previewX + 16, previewY + 16);
            
            let yOffset = previewY + 36;
            Object.entries(state.wavePreview).forEach(([type, count]) => {
                const typeColor = COLORS[type as keyof typeof COLORS] || COLORS.normal;
                ctx.fillStyle = typeColor;
                ctx.beginPath();
                ctx.arc(previewX + 24, yOffset + 8, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = COLORS.text;
                ctx.font = '400 13px -apple-system, "SF Pro Text", system-ui, sans-serif';
                ctx.fillText(`${type}: ${count}`, previewX + 36, yOffset);
                yOffset += 24;
            });
            
            ctx.restore();
        }
        
        // Wave incoming overlay
        if (state.wave > 0 && state.waveQueue.length > 0 && state.nextSpawnIndex < state.waveQueue.length) {
            const elapsed = time - (state.waveStartTime || time);
            if (elapsed < 2000) {
                const alpha = Math.max(0, 1 - elapsed / 2000);
                const scale = 1 + (1 - alpha) * 0.5;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(width / 2, height / 2);
                ctx.scale(scale, scale);
                
                drawGlassPanel(ctx, -120, -30, 240, 60, 12);
                
                ctx.font = '600 20px -apple-system, "SF Pro Display", system-ui, sans-serif';
                ctx.fillStyle = COLORS.text;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(copy.waveIncoming.replace('{wave}', String(state.wave)), 0, 0);
                
                ctx.restore();
            }
        }
        
        // Game over overlay
        // Achievement Notification
        if (achievementRef.current) {
            const elapsed = performance.now() - achievementRef.current.time;
            if (elapsed < 3000) {
                const alpha = elapsed < 2500 ? 1 : 1 - (elapsed - 2500) / 500;
                ctx.save();
                ctx.globalAlpha = alpha;
                drawGlassPanel(ctx, width / 2 - 150, 100, 300, 60, 16);
                ctx.font = '600 16px -apple-system, "SF Pro Display", system-ui, sans-serif';
                ctx.fillStyle = COLORS.warning;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Achievement Unlocked: ' + achievementRef.current.id, width / 2, 130);
                ctx.restore();
            } else {
                achievementRef.current = null;
            }
        }

        if (state.mode === 'gameover') {
            const gameoverAnimDuration = 500; // ms
            const gameoverProgress = gameOverTimeRef.current ? Math.min(1, (time - gameOverTimeRef.current) / gameoverAnimDuration) : 0;
            
            ctx.save();
            ctx.globalAlpha = gameoverProgress;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, width, height);
            
            const result = buildGameResult(state);
            
            // Glass panel for game over
            drawGlassPanel(ctx, width / 2 - 200, height / 2 - 140, 400, 280, 24);
            
            ctx.font = '700 32px -apple-system, "SF Pro Display", system-ui, sans-serif';
            ctx.fillStyle = COLORS.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(copy.gameOver, width / 2, height / 2 - 100);
            
            // Score with emphasis
            ctx.font = '600 24px -apple-system, "SF Pro Display", system-ui, sans-serif';
            ctx.fillStyle = COLORS.warning;
            ctx.fillText(`${copy.score} ${result.score}`, width / 2, height / 2 - 50);
            
            // Stats in glass panels
            const statsY = height / 2;
            drawGlassPanel(ctx, width / 2 - 160, statsY - 20, 140, 40, 8);
            drawGlassPanel(ctx, width / 2 + 20, statsY - 20, 140, 40, 8);
            
            ctx.font = '500 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
            ctx.fillStyle = COLORS.textSecondary;
            ctx.textAlign = 'center';
            ctx.fillText(`${copy.wave} ${result.wave}`, width / 2 - 90, statsY);
            ctx.fillText(`${copy.wpm} ${result.wpm}`, width / 2 + 90, statsY);
            
            // More stats
            drawGlassPanel(ctx, width / 2 - 160, statsY + 30, 140, 40, 8);
            drawGlassPanel(ctx, width / 2 + 20, statsY + 30, 140, 40, 8);
            
            ctx.fillText(`${copy.accuracy} ${result.accuracy}%`, width / 2 - 90, statsY + 50);
            ctx.fillText(`${copy.enemiesDefeated} ${result.enemiesDefeated}`, width / 2 + 90, statsY + 50);
            
            // Action prompts
            ctx.font = '500 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
            ctx.fillStyle = COLORS.textTertiary;
            ctx.fillText(`${copy.playAgain} (R)  |  ${copy.backToHome} (Esc)`, width / 2, height / 2 + 110);
            
            ctx.restore();
            return;
        }
        
        ctx.restore();
    }, [copy, saveGameResult]);
    
    // Game loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        function resize() {
            const container = canvas!.parentElement;
            if (!container) return;
            canvas!.width = container.clientWidth;
            canvas!.height = container.clientHeight;
        }
        
        resize();
        window.addEventListener('resize', resize);
        
        function gameLoop(timestamp: number) {
            if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
            const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
            lastTimeRef.current = timestamp;
            
            tick(dt);
            renderFrame();
            animFrameRef.current = requestAnimationFrame(gameLoop);
        }
        
        animFrameRef.current = requestAnimationFrame(gameLoop);
        
        return () => {
            window.removeEventListener('resize', resize);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [tick, renderFrame]);
    
    // Keyboard input
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const state = stateRef.current;
            
            if (state.mode === 'idle') {
                if (e.key === 'Escape') return;
                initSound();
                startTimeRef.current = performance.now();
                stateRef.current = transitionGameMode(state, 'start');
                stateRef.current = startWave(stateRef.current, wordPoolRef.current, {
                    canvasWidth: canvasRef.current ? canvasRef.current.width : 800,
                    canvasHeight: canvasRef.current ? canvasRef.current.height : 600,
                    kps: stateRef.current.kps
                });
                setUiState('playing');
                return;
            }
            
            if (e.key === 'Escape') {
                if (state.mode === 'playing') {
                    stateRef.current = transitionGameMode(state, 'pause');
                    setUiState('paused');
                } else if (state.mode === 'paused') {
                    stateRef.current = transitionGameMode(state, 'resume');
                    setUiState('playing');
                } else if (state.mode === 'gameover') {
                    stateRef.current = createGameState();
                    setUiState('idle');
                }
                return;
            }
            
            if (state.mode === 'gameover' && (e.key === 'r' || e.key === 'R')) {
                stateRef.current = createGameState();
                setUiState('idle');
                return;
            }
            
            if (state.mode === 'playing' && e.key.length === 1) {
                e.preventDefault();
                const result = processInput(state, e.key);
                stateRef.current = result.state;
                
                result.events.forEach((event: any) => {
                    if (event.type === 'enemy_killed') {
                        playKillSound();
                        playComboSound(stateRef.current.combo);
                        const enemy = state.enemies.find((en: any) => en.id === event.enemyId);
                        if (enemy) {
                            // Kill particles
                            const color = COLORS[enemy.type as keyof typeof COLORS] || COLORS.normal;
                            particlesRef.current.emit(enemy.x, enemy.y, 25, color, { speed: 4, size: 4 });
                            particlesRef.current.emit(enemy.x, enemy.y, 10, '#ffffff', { speed: 2, size: 2 });
                            shakeRef.current.trigger(6);
                        }
                    }
                    if (event.type === 'char_correct') {
                        playClickSound();
                        // Input ripple effect
                        const activeEnemy = state.enemies.find((en: any) => en.id === event.enemyId);
                        if (activeEnemy) {
                            particlesRef.current.emit(activeEnemy.x, activeEnemy.y, 3, COLORS.success, { speed: 1, size: 2 });
                        }
                    }
                    if (event.type === 'char_error') {
                        playErrorSound();
                        // Error flash
                        shakeRef.current.trigger(2);
                    }
                    if (event.type === 'char_miss') {
                        potentialMatchesRef.current = event.matches || [];
                    }
                    if (event.type === 'achievement_unlocked') {
                        achievementRef.current = { id: event.achievementId, time: performance.now() };
                    }
                });
            }
        }
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    return (
        <div className="game-container">
            <canvas ref={canvasRef} className="game-canvas" />
        </div>
    );
}
