'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { HelpCircle, Home, Pause, Play, Settings } from 'lucide-react';
import { GameTopBar } from '@typemaster/ui';
import '../features/game-vnext/components/game-shell.css';
import { useGameStore } from '../features/game/state/game-store';
import { type GameCommand } from '../features/game-vnext/runtime/game-engine';
import { useAppNavigate } from '../application/use-app-navigate';
import { getCopy } from '../i18n';
import ModeSelectOverlay from '../features/game-vnext/components/ModeSelectOverlay';
import HudOverlay from '../features/game-vnext/components/HudOverlay';
import UpgradeOverlay from '../features/game-vnext/components/UpgradeOverlay';
import PauseOverlay from '../features/game-vnext/components/PauseOverlay';
import RunResultOverlay from '../features/game-vnext/components/RunResultOverlay';
import CodexOverlay from '../features/game-vnext/components/CodexOverlay';
import { useGameEngine } from '../features/game-vnext/hooks/use-game-engine';
import { useGameInput } from '../features/game-vnext/hooks/use-game-input';
import { useGameLoop } from '../features/game-vnext/hooks/use-game-loop';
import { useGameRenderer } from '../features/game-vnext/hooks/use-game-renderer';
import { useGameResultPersistence } from '../features/game-vnext/hooks/use-game-result-persistence';
import { useGameTestBridge } from '../features/game-vnext/hooks/use-game-test-bridge';
import type { GameSnapshot } from '../types/game';

type GamePageProps = {
    onExit?: () => void;
};

function getFocusChars(keyboardHotspots: any) {
    const chars = keyboardHotspots?.primaryZone?.chars;
    if (!Array.isArray(chars)) return [];
    return chars
        .map((item) => String(item?.label || '').toLowerCase())
        .filter((char) => char.length === 1)
        .slice(0, 5);
}

export default function GamePage({ onExit }: GamePageProps) {
    const navigate = useAppNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastUiCommitRef = useRef(0);
    const snapshotRef = useRef<GameSnapshot | null>(null);
    const { keyboardHotspots, language, gameBestScore, gameCodex, recordCompletedGameSession } = useGameStore();
    const focusChars = useMemo(() => getFocusChars(keyboardHotspots), [keyboardHotspots]);
    const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
    const [showCodex, setShowCodex] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const copy = useMemo(() => getCopy(language || 'zh-CN'), [language]);

    const {
        bestScore,
        isBestResult,
        maybeSaveResult,
        resetSavedResult
    } = useGameResultPersistence({
        bestScore: gameBestScore,
        recordCompletedGameSession
    });

    const rendererRef = useGameRenderer({ canvasRef, containerRef });

    const commitUpdate = useCallback((update: { snapshot: GameSnapshot; events: any[] }, immediate = false) => {
        const renderer = rendererRef.current;
        const previous = snapshotRef.current;
        const next = update.snapshot;

        if (renderer) renderer.handleEvents(update.events || [], next);

        snapshotRef.current = next;
        const now = performance.now();
        const phaseChanged = previous?.phase !== next?.phase;
        const hasEvents = (update.events || []).length > 0;

        if (immediate || phaseChanged || hasEvents || now - lastUiCommitRef.current >= 100) {
            lastUiCommitRef.current = now;
            setSnapshot(next);
        }
    }, [rendererRef]);

    const { dispatchAction, engineRef, startGame } = useGameEngine({
        commitUpdate,
        focusChars,
        language: language || 'zh-CN',
        maybeSaveResult,
        resetSavedResult
    });

    const dispatchAndFocus = useCallback((command: GameCommand, payload: Record<string, unknown> = {}) => {
        dispatchAction(command, payload);
        inputRef.current?.focus({ preventScroll: true });
    }, [dispatchAction]);

    const handleStart = useCallback((gameMode) => {
        startGame(gameMode);
        inputRef.current?.focus({ preventScroll: true });
    }, [startGame]);

    const handleExit = useCallback(() => {
        if (onExit) {
            onExit();
            return;
        }

        navigate('/');
    }, [navigate, onExit]);

    const handlePauseAction = useCallback((action: string) => {
        if (action === 'resume') dispatchAndFocus('resume');
        if (action === 'retry') dispatchAndFocus('retry', { focusChars });
        if (action === 'extract') dispatchAndFocus('extract');
        if (action === 'quit') handleExit();
    }, [dispatchAndFocus, focusChars, handleExit]);

    const handleResultAction = useCallback((action: string) => {
        if (action === 'retry') dispatchAndFocus('retry', { focusChars });
        if (action === 'codex') setShowCodex(true);
        if (action === 'menu') handleExit();
    }, [dispatchAndFocus, focusChars, handleExit]);

    const handleTopPauseAction = useCallback(() => {
        const phase = snapshotRef.current?.phase;
        if (phase === 'playing') dispatchAndFocus('pause');
        if (phase === 'paused') dispatchAndFocus('resume');
    }, [dispatchAndFocus]);

    const handleOpenSettings = useCallback(() => {
        window.dispatchEvent(new CustomEvent('typemaster:open-settings'));
    }, []);

    useGameLoop({
        canvasRef,
        commitUpdate,
        engineRef,
        maybeSaveResult,
        rendererRef
    });

    const { handleInputKeyDown, handleVirtualBeforeInput } = useGameInput({
        commitUpdate,
        dispatchAction: dispatchAndFocus,
        engineRef,
        inputRef,
        maybeSaveResult
    });

    useGameTestBridge({
        canvasRef,
        commitUpdate,
        engineRef,
        maybeSaveResult,
        rendererRef,
        snapshotRef
    });

    const resultOverlay = snapshot?.overlay?.type === 'result'
        ? {
            ...snapshot.overlay.result,
            isVictory: snapshot.overlay.isVictory,
            isBest: isBestResult(snapshot, snapshot.overlay.result)
        }
        : null;
    const isPlaying = snapshot?.phase === 'playing';
    const isPaused = snapshot?.phase === 'paused';
    const isUpgrade = Boolean(snapshot?.upgradeChoices?.length);
    const topSubtitle = snapshot?.phase === 'idle'
        ? copy.game.topIdle
        : isPaused
            ? copy.game.topPaused
            : isUpgrade
                ? copy.game.topUpgrade
                : resultOverlay
                    ? copy.game.topResult
                    : copy.game.topPlaying;
    const showGameTopBar = snapshot?.phase !== 'idle';

    return (
        <div
            ref={containerRef}
            className="typerift-container"
            role="application"
            aria-label={copy.game.aria}
            onPointerDown={() => inputRef.current?.focus({ preventScroll: true })}
        >
            {showGameTopBar ? (
                <GameTopBar
                    eyebrow={copy.game.topEyebrow}
                    title={copy.game.topTitle}
                    subtitle={topSubtitle}
                    primary={{
                        id: 'exit',
                        label: copy.game.exit,
                        ariaLabel: copy.game.exit,
                        icon: Home,
                        onClick: handleExit
                    }}
                    actions={[
                        {
                            id: 'pause',
                            label: isPaused ? copy.game.resume : copy.game.pause,
                            ariaLabel: isPaused ? copy.game.resume : copy.game.pause,
                            icon: isPaused ? Play : Pause,
                            disabled: !isPlaying && !isPaused,
                            onClick: handleTopPauseAction
                        },
                        {
                            id: 'settings',
                            label: copy.game.settings,
                            ariaLabel: copy.game.settings,
                            icon: Settings,
                            onClick: handleOpenSettings
                        },
                        {
                            id: 'help',
                            label: copy.game.help,
                            ariaLabel: copy.game.help,
                            icon: HelpCircle,
                            onClick: () => setShowHelp(true)
                        }
                    ]}
                />
            ) : null}
            <canvas
                ref={canvasRef}
                className="typerift-canvas"
                role="img"
                aria-label={copy.game.canvasAria}
            />
            <input
                ref={inputRef}
                className="typerift-keyboard-input"
                aria-label={copy.game.inputAria}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                onBeforeInput={handleVirtualBeforeInput}
                onKeyDown={handleInputKeyDown}
            />
            {snapshot?.phase === 'idle' && (
                <ModeSelectOverlay
                    bestScore={bestScore}
                    copy={copy}
                    codexProgress={gameCodex || snapshot.codexProgress}
                    onStart={handleStart}
                />
            )}
            {snapshot?.phase === 'playing' && (
                <HudOverlay
                    data={snapshot.hud}
                    copy={copy}
                    onSurge={() => dispatchAndFocus('surge')}
                />
            )}
            {snapshot?.phase === 'playing' && snapshot.upgradeChoices?.length ? (
                <UpgradeOverlay choices={snapshot.upgradeChoices} copy={copy} onChoose={(upgradeId) => dispatchAndFocus('choose-upgrade', { upgradeId })} />
            ) : null}
            {snapshot?.phase === 'paused' && (
                <PauseOverlay stats={snapshot.hud} copy={copy} onAction={handlePauseAction} />
            )}
            {resultOverlay && (
                <RunResultOverlay data={resultOverlay} copy={copy} onAction={handleResultAction} />
            )}
            <div className="typerift-sr-only" role="status" aria-live="polite" aria-atomic="true">
                {snapshot?.liveMessage || ''}
            </div>
            {showCodex && (
                <CodexOverlay codex={gameCodex || snapshot?.codexProgress} copy={copy} onClose={() => setShowCodex(false)} />
            )}
            {showHelp && (
                <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={copy.game.helpTitle}>
                    <section className="typerift-panel">
                        <div className="typerift-panel__inner">
                            <div className="typerift-heading">
                                <span>{copy.game.help}</span>
                                <h2>{copy.game.helpTitle}</h2>
                                <p>{copy.game.helpBody}</p>
                            </div>
                            <div className="typerift-actions">
                                <button className="typerift-action typerift-action--primary" type="button" onClick={() => setShowHelp(false)} autoFocus>
                                    {copy.game.helpDismiss}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
