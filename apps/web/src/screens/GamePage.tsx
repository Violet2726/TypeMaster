'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import '../../src/styles/game-page.css';
import { useGameStore } from '../features/game/state/game-store';
import { appendSession } from '../services/storage/sessions-repo';
import { createGameEngine } from '../engine/game-engine';
import { initTouchInput, destroyTouchInput, focusInput, isMobile } from '../engine/touch-input';
import type { GameEngine } from '../engine/game-engine';
import IdleScreenOverlay from '../components/idle/IdleScreenOverlay';
import PauseMenuOverlay from '../components/overlay/PauseMenuOverlay';
import GameplayHud from '../components/overlay/GameplayHud';

// ---------------------------------------------------------------------------
// GamePage - thin React shell around the engine
// ---------------------------------------------------------------------------

export default function GamePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [idleMode, setIdleMode] = useState(true);
    const [pausedMode, setPausedMode] = useState(false);
    const [hudData, setHudData] = useState({ score: 0, wave: 1, combo: 0, maxCombo: 0, lives: 5, maxLives: 5, accuracy: 100 });
    const [pauseData, setPauseData] = useState({ score: 0, wave: 1, combo: 0, maxCombo: 0, lives: 5, maxLives: 5, enemiesDefeated: 0, accuracy: 100, wpm: 0, duration: 0 });
    const engineRef = useRef<GameEngine | null>(null);
    const animRef = useRef<number>(0);
    const lastTimeRef = useRef(0);
    const { keyboardHotspots } = useGameStore();

    const handlePauseAction = useCallback((action: string) => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.dispatchPauseAction(action);
    }, []);

    const handleIdleAction = useCallback((action: string) => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.dispatchIdleAction(action);
    }, []);

    const saveResult = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return;
        const result = engine.saveGameResult();
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

    // Testing hooks
    useEffect(() => {
        (window as any).render_game_to_text = function () {
            const engine = engineRef.current;
            if (!engine) return '{}';
            const s = engine.state;
            return JSON.stringify({
                mode: s.mode, score: s.score, wave: s.wave, combo: s.combo,
                maxCombo: s.maxCombo, lives: s.lives, enemiesDefeated: s.enemiesDefeated,
                enemiesLeaked: s.enemiesLeaked, enemiesTotal: s.enemiesTotal,
                activeEnemyId: s.activeEnemyId, typedInput: s.typedInput,
                enemies: s.enemies.filter((e: any) => e.alive).map((e: any) => ({
                    id: e.id, type: e.type, word: e.word,
                    x: Math.round(e.x), y: Math.round(e.y), typed: e.typed
                }))
            });
        };
        (window as any).advanceTime = function (ms: number) {
            const engine = engineRef.current;
            if (!engine) return;
            const steps = Math.max(1, Math.round(ms / (1000 / 60)));
            for (let i = 0; i < steps; i++) engine.tick(1 / 60);
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) engine.render(ctx, canvas.width, canvas.height);
            }
        };
        return () => {
            delete (window as any).render_game_to_text;
            delete (window as any).advanceTime;
        };
    }, []);

    // Game loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const engine = createGameEngine();
        engineRef.current = engine;
        engine.suppressIdleKeys = true;

        // Initialize touch input for mobile
        if (isMobile()) {
            initTouchInput({
                onChar: (ch) => {
                    const fakeEvent = new KeyboardEvent('keydown', { key: ch, bubbles: true });
                    engine.handleKey(fakeEvent);
                },
                onKey: (key) => {
                    const fakeEvent = new KeyboardEvent('keydown', { key, bubbles: true });
                    engine.handleKey(fakeEvent);
                },
            });
        }

        function resize() {
            const container = canvas!.parentElement;
            if (!container) return;
            canvas!.width = container.clientWidth;
            canvas!.height = container.clientHeight;
            engine.resize(canvas!.width, canvas!.height);
        }
        resize();
        window.addEventListener('resize', resize);

        // Canvas click/touch for run map and encounter UI
        function handleCanvasClick(e: MouseEvent | TouchEvent) {
            const rect = canvas!.getBoundingClientRect();
            let clientX: number, clientY: number;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            if (engine.handleCanvasClick) engine.handleCanvasClick(x, y);
        }
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); handleCanvasClick(e); });

        function gameLoop(ts: number) {
            if (lastTimeRef.current === 0) lastTimeRef.current = ts;
            const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
            lastTimeRef.current = ts;

            // Auto-save on game over transition
            const wasGameOver = engine.state.mode === 'gameover';

            engine.tick(dt);
            setIdleMode(engine.state.mode === 'idle');
            const isPaused = engine.state.mode === 'paused';
            setPausedMode(isPaused);
            if (isPaused) {
                setPauseData(engine.getPauseData());
                engine.suppressCanvasPause = true;
            } else {
                engine.suppressCanvasPause = false;
            }
            if (engine.state.mode === 'playing' || engine.state.mode === 'resuming') {
                setHudData(engine.getHudData());
            }

            const ctx = canvas!.getContext('2d');
            if (ctx) engine.render(ctx, canvas!.width, canvas!.height);

            if (!wasGameOver && engine.state.mode === 'gameover') {
                saveResult();
            }

            animRef.current = requestAnimationFrame(gameLoop);
        }
        animRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animRef.current);
            engine.destroy();
            destroyTouchInput();
        };
    }, [saveResult]);

    // Keyboard
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            engineRef.current?.handleKey(e);
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <div className="game-container" role="application" aria-label="Typing Raid - ��Ϸ����">
            {idleMode && <IdleScreenOverlay onAction={handleIdleAction} />}
            {pausedMode && <PauseMenuOverlay stats={pauseData} onAction={handlePauseAction} />}
            {!idleMode && !pausedMode && engineRef.current && engineRef.current.state.mode !== 'gameover' && (
                <GameplayHud data={hudData} />
            )}
            <canvas
                ref={canvasRef}
                className="game-canvas"
                role="img"
                aria-label="����ͻϮ��Ϸ���� - ���뵥���������"
                tabIndex={0}
            />
            {/* Live region for screen reader announcements */}
            <div
                className="sr-only"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            />
        </div>
    );
}