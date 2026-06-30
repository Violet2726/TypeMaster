'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import '../../src/styles/game-page.css';
import { useGameStore } from '../features/game/state/game-store';
import { createGameEngine, type GameEngine, type RaidMode } from '../engine/game-engine';
import { MonsterRaidRenderer } from '../engine/raid-renderer';
import { useAppNavigate } from '../application/use-app-navigate';
import IdleScreenOverlay from '../components/idle/IdleScreenOverlay';
import PauseMenuOverlay from '../components/overlay/PauseMenuOverlay';
import GameplayHud from '../components/overlay/GameplayHud';
import GameOverOverlay from '../components/overlay/GameOverOverlay';
import RelicChoiceOverlay from '../components/overlay/RelicChoiceOverlay';
import CodexOverlay from '../components/overlay/CodexOverlay';

function getFocusChars(keyboardHotspots: any) {
    const chars = keyboardHotspots?.primaryZone?.chars;
    if (!Array.isArray(chars)) return [];
    return chars
        .map((item) => String(item?.label || '').toLowerCase())
        .filter((char) => char.length === 1)
        .slice(0, 5);
}

export default function GamePage() {
    const navigate = useAppNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const rendererRef = useRef<MonsterRaidRenderer | null>(null);
    const frameRef = useRef<number>(0);
    const lastFrameTimeRef = useRef(0);
    const lastUiCommitRef = useRef(0);
    const snapshotRef = useRef<any>(null);
    const savedResultKeyRef = useRef('');
    const bestScoreRef = useRef(0);
    const bestResultKeyRef = useRef('');
    const { keyboardHotspots, language, raidBestScore, riftCodex, recordCompletedRaidSession } = useGameStore();
    const focusChars = useMemo(() => getFocusChars(keyboardHotspots), [keyboardHotspots]);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [bestScore, setBestScore] = useState(0);
    const [showCodex, setShowCodex] = useState(false);

    const commitUpdate = useCallback((update: any, immediate = false) => {
        const renderer = rendererRef.current;
        const previous = snapshotRef.current;
        const next = update.snapshot;

        if (renderer) {
            renderer.handleEvents(update.events || [], next);
        }

        snapshotRef.current = next;
        const now = performance.now();
        const phaseChanged = previous?.phase !== next?.phase;
        const hasEvents = (update.events || []).length > 0;

        if (immediate || phaseChanged || hasEvents || now - lastUiCommitRef.current >= 100) {
            lastUiCommitRef.current = now;
            setSnapshot(next);
        }
    }, []);

    const maybeSaveResult = useCallback((nextSnapshot: any) => {
        if (!nextSnapshot || nextSnapshot.phase !== 'gameover') return;
        const result = nextSnapshot.overlay?.result;
        if (!result) return;

        const key = `${nextSnapshot.phase}:${result.score}:${result.durationSeconds}:${result.maxCombo}`;
        if (savedResultKeyRef.current === key) return;
        savedResultKeyRef.current = key;
        if (result.score > bestScoreRef.current) {
            bestResultKeyRef.current = key;
        }

        recordCompletedRaidSession(result);
        setBestScore((current) => {
            const next = Math.max(current, result.score);
            bestScoreRef.current = next;
            return next;
        });
    }, [recordCompletedRaidSession]);

    const dispatchAction = useCallback((command: string, payload: Record<string, unknown> = {}) => {
        const engine = engineRef.current;
        if (!engine) return;

        if (command === 'start' || command === 'retry') {
            savedResultKeyRef.current = '';
        }

        const update = engine.dispatch(command as any, payload);
        commitUpdate(update, true);
        maybeSaveResult(update.snapshot);
        inputRef.current?.focus({ preventScroll: true });
    }, [commitUpdate, maybeSaveResult]);

    const handleIdleAction = useCallback((action: string) => {
        if (action === 'codex') {
            setShowCodex(true);
            return;
        }
        const raidMode: RaidMode = action === 'daily-mutation'
            ? 'daily-mutation'
            : action === 'first-breach'
                ? 'first-breach'
                : 'endless-rift';
        dispatchAction('start', {
            raidMode,
            focusChars
        });
    }, [dispatchAction, focusChars]);

    const handlePauseAction = useCallback((action: string) => {
        if (action === 'resume') dispatchAction('resume');
        if (action === 'retry') dispatchAction('retry', { focusChars });
        if (action === 'extract') dispatchAction('extract');
        if (action === 'quit') navigate('/');
    }, [dispatchAction, focusChars, navigate]);

    const handleResultAction = useCallback((action: string) => {
        if (action === 'retry') dispatchAction('retry', { focusChars });
        if (action === 'codex') setShowCodex(true);
        if (action === 'menu') navigate('/');
    }, [dispatchAction, focusChars, navigate]);

    const handleRelicChoice = useCallback((relicId: string) => {
        dispatchAction('choose-relic', { relicId });
    }, [dispatchAction]);

    useEffect(() => {
        bestScoreRef.current = raidBestScore;
        setBestScore(raidBestScore);
    }, [raidBestScore]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const engine = createGameEngine({
            language: language || 'zh-CN',
            focusChars
        });
        const renderer = new MonsterRaidRenderer();
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        renderer.setReducedMotion(reducedMotion.matches);

        engineRef.current = engine;
        rendererRef.current = renderer;
        commitUpdate({ snapshot: engine.snapshot, events: [] }, true);

        function resize() {
            const rect = container!.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.floor(rect.width));
            const height = Math.max(1, Math.floor(rect.height));

            canvas!.width = Math.floor(width * dpr);
            canvas!.height = Math.floor(height * dpr);
            canvas!.style.width = `${width}px`;
            canvas!.style.height = `${height}px`;

            const ctx = canvas!.getContext('2d');
            if (ctx) {
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            engine.resize(width, height);
            renderer.resize(width, height, dpr);
        }

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        resize();

        function loop(timestamp: number) {
            const ctx = canvas!.getContext('2d');
            if (!ctx) return;

            if (document.hidden) {
                lastFrameTimeRef.current = timestamp;
                frameRef.current = requestAnimationFrame(loop);
                return;
            }

            if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
            const delta = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.08);
            lastFrameTimeRef.current = timestamp;

            const update = engine.tick(delta);
            commitUpdate(update);
            renderer.render(ctx, update.snapshot, delta);
            maybeSaveResult(update.snapshot);

            frameRef.current = requestAnimationFrame(loop);
        }

        frameRef.current = requestAnimationFrame(loop);

        function handleReducedMotionChange(event: MediaQueryListEvent) {
            renderer.setReducedMotion(event.matches);
        }

        reducedMotion.addEventListener('change', handleReducedMotionChange);

        return () => {
            cancelAnimationFrame(frameRef.current);
            resizeObserver.disconnect();
            reducedMotion.removeEventListener('change', handleReducedMotionChange);
            engine.destroy();
            engineRef.current = null;
            rendererRef.current = null;
        };
    }, [commitUpdate, language, maybeSaveResult]);

    useEffect(() => {
        function handleKey(event: KeyboardEvent) {
            if (event.target === inputRef.current) return;
            const engine = engineRef.current;
            if (!engine) return;
            const update = engine.handleKey(event);
            commitUpdate(update, update.events.length > 0);
            maybeSaveResult(update.snapshot);
        }

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [commitUpdate, maybeSaveResult]);

    useEffect(() => {
        (window as any).render_game_to_text = function () {
            const current = snapshotRef.current;
            if (!current) return '{}';
            return JSON.stringify({
                phase: current.phase,
                hud: current.hud,
                enemies: current.arena.enemies.map((enemy: any) => ({
                    id: enemy.id,
                    type: enemy.type,
                    word: enemy.word,
                    typed: enemy.typed,
                    y: Number(enemy.y.toFixed(3))
                }))
            });
        };

        (window as any).advanceTime = function (ms: number) {
            const engine = engineRef.current;
            const renderer = rendererRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!engine || !renderer || !ctx) return;

            const steps = Math.max(1, Math.round(ms / 16));
            let update = { snapshot: engine.snapshot, events: [] as any[] };
            for (let i = 0; i < steps; i += 1) {
                update = engine.tick(1 / 60);
            }
            commitUpdate(update, true);
            renderer.render(ctx, update.snapshot, 1 / 60);
            maybeSaveResult(update.snapshot);
        };

        return () => {
            delete (window as any).render_game_to_text;
            delete (window as any).advanceTime;
        };
    }, [commitUpdate, maybeSaveResult]);

    const handleVirtualBeforeInput = useCallback((event: FormEvent<HTMLInputElement>) => {
        const nativeEvent = event.nativeEvent as InputEvent;
        const char = String(nativeEvent.data || '').slice(-1).toLowerCase();
        if (!char) return;
        event.preventDefault();
        const engine = engineRef.current;
        if (engine?.state?.relicChoices?.length && /^[123]$/.test(char)) {
            dispatchAction('choose-relic', { relicId: engine.state.relicChoices[Number(char) - 1]?.id });
            if (inputRef.current) inputRef.current.value = '';
            return;
        }
        dispatchAction('type-char', { char });
        if (inputRef.current) inputRef.current.value = '';
    }, [dispatchAction]);

    const handleInputKeyDown = useCallback((event: ReactKeyboardEvent<HTMLInputElement>) => {
        const engine = engineRef.current;
        if (!engine) return;
        if (engine.state?.relicChoices?.length && /^[123]$/.test(event.key)) {
            event.preventDefault();
            const update = engine.handleKey(event.nativeEvent);
            commitUpdate(update, update.events.length > 0);
            maybeSaveResult(update.snapshot);
            return;
        }
        if (event.key.length === 1) return;
        const update = engine.handleKey(event.nativeEvent);
        commitUpdate(update, update.events.length > 0);
        maybeSaveResult(update.snapshot);
    }, [commitUpdate, maybeSaveResult]);

    const resultOverlay = snapshot?.overlay?.type === 'result'
        ? {
            ...snapshot.overlay.result,
            isVictory: snapshot.overlay.isVictory,
            isBest: bestResultKeyRef.current === `${snapshot.phase}:${snapshot.overlay.result?.score}:${snapshot.overlay.result?.durationSeconds}:${snapshot.overlay.result?.maxCombo}`
                || (snapshot.overlay.result?.score || 0) > bestScore
        }
        : null;

    return (
        <div
            ref={containerRef}
            className="game-container"
            role="application"
            aria-label="Arcade Rift 打字街机游戏"
            onPointerDown={() => inputRef.current?.focus({ preventScroll: true })}
        >
            <canvas
                ref={canvasRef}
                className="game-canvas"
                role="img"
                aria-label="Arcade Rift 发光裂隙战场，输入怪物身上的词以清除目标"
            />
            <input
                ref={inputRef}
                className="game-keyboard-input"
                aria-label="Arcade Rift input"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                onBeforeInput={handleVirtualBeforeInput}
                onKeyDown={handleInputKeyDown}
            />
            {snapshot?.phase === 'idle' && (
                <IdleScreenOverlay
                    focusChars={focusChars}
                    bestScore={bestScore}
                    mutation={snapshot.mutation}
                    codexProgress={riftCodex || snapshot.codexProgress}
                    onAction={handleIdleAction}
                />
            )}
            {snapshot?.phase === 'playing' && <GameplayHud data={snapshot.hud} activeRelics={snapshot.activeRelics || []} />}
            {snapshot?.phase === 'playing' && snapshot.relicChoices?.length ? (
                <RelicChoiceOverlay choices={snapshot.relicChoices} onChoose={handleRelicChoice} />
            ) : null}
            {snapshot?.phase === 'paused' && (
                <PauseMenuOverlay stats={snapshot.hud} onAction={handlePauseAction} />
            )}
            {resultOverlay && (
                <GameOverOverlay data={resultOverlay} onAction={handleResultAction} />
            )}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {snapshot?.liveMessage || ''}
            </div>
            {showCodex && (
                <CodexOverlay codex={riftCodex || snapshot?.codexProgress || snapshot?.codexUnlocks} onClose={() => setShowCodex(false)} />
            )}
        </div>
    );
}
