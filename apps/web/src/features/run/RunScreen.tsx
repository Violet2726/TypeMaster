'use client';

import type { CSSProperties, MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ChevronRight, Gauge, Keyboard, LogOut, Play, RadioTower, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import {
    AREAS,
    CONTENT_VERSION,
    buildRunResult,
    createRun,
    dispatchRun,
    tickRun,
    type ReplayEntry,
    type RunCommand,
    type RunMode,
    type RunState
} from '@typerift/domain';
import type { CompleteRunRequest } from '@typerift/contracts';
import { GameButton, GameDialog } from '@typerift/ui';
import { api } from '../../lib/api';
import { listLocalRuns, queueCompletion, saveLocalRun } from '../../lib/storage';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';
import { HudOverlay, type HudFeedback } from './components/HudOverlay';
import { ModeSelectOverlay } from './components/ModeSelectOverlay';
import { useRunFeedback } from './hooks/use-run-feedback';
import { feedbackFromEvents } from './runtime/feedback';
import { planAssets } from './runtime/asset-plan';
import { getAmbientLoop, getImage, loadCriticalAssets, loadIdleAssets, loadWarmAssets, playSound } from './runtime/asset-loader';
import { allowsAmbientMotion, resolveGameTheme, type GameVisualTheme } from './presentation/game-theme';

const VALID_MODES = new Set<RunMode>(['first-rift', 'expedition', 'daily-rift', 'repair-trial', 'quick-pulse']);
const FIXED_STEP_MS = 1000 / 60;

function modeFrom(value: string | null): RunMode {
    return VALID_MODES.has(value as RunMode) ? (value as RunMode) : 'expedition';
}
function formatTime(milliseconds: number) {
    const total = Math.max(0, Math.ceil(milliseconds / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function RunScreen() {
    const router = useRouter();
    const params = useSearchParams();
    // Without an explicit mode we show the entry gate instead of guessing (guidance §4).
    const requestedMode = params.get('mode');
    const hasMode = requestedMode !== null;
    const mode = modeFrom(requestedMode);
    const locale = useUiStore((store) => store.settings.locale);
    const settings = useUiStore((store) => store.settings);
    const t = useCallback((key: string) => translate(locale, key), [locale]);
    const [state, setState] = useState<RunState | null>(null);
    const [coarsePointer, setCoarsePointer] = useState(false);
    const [runKey, setRunKey] = useState(0);
    const openSettings = useUiStore((store) => store.openSettings);
    const stateRef = useRef<RunState | null>(null);
    const commandLog = useRef<ReplayEntry[]>([]);
    const submitted = useRef(false);
    const music = useRef<HTMLAudioElement | null>(null);
    const { feedback, pushFeedback } = useRunFeedback();

    const publish = useCallback((next: RunState) => {
        stateRef.current = next;
        setState(next);
    }, []);
    const sound = useCallback(
        (kind: 'hit' | 'error' | 'surge') => {
            if (!settings.effects) return;
            playSound(`/game/v1/audio/${kind}.wav`, 0.42);
            if (settings.music && !music.current) {
                const ambient = getAmbientLoop(0.12);
                music.current = ambient;
                void ambient?.play().catch(() => undefined);
            }
        },
        [settings.effects, settings.music]
    );

    useEffect(() => {
        if (!settings.music) {
            music.current?.pause();
            music.current = null;
        }
        return () => {
            music.current?.pause();
            music.current = null;
        };
    }, [settings.music]);

    const send = useCallback(
        (command: RunCommand) => {
            const current = stateRef.current;
            if (!current) return;
            commandLog.current.push({ atMs: Math.round(current.elapsedMs), command });
            const applied = dispatchRun(current, command);
            if (applied.state === current) return;
            publish(applied.state);
            const message = feedbackFromEvents(current, applied.state, applied.events, t);
            if (message) pushFeedback(message);
            const event = applied.events.at(-1);
            if (event?.type === 'error') sound('error');
            else if (event?.type === 'surge') sound('surge');
            else if (event?.type === 'typed' || event?.type === 'defeated') sound('hit');
        },
        [publish, pushFeedback, sound, t]
    );

    useEffect(() => {
        setCoarsePointer(window.matchMedia('(pointer: coarse)').matches);
        if (!hasMode) return;
        let cancelled = false;
        let cancelIdle: (() => void) | undefined;
        // Aborting matters: React 18 double-invokes effects in development, and without a
        // signal the first mount leaves an orphaned run ticket on the server.
        const controller = new AbortController();
        void (async () => {
            const plan = planAssets(mode, 0);
            const clientRunId = crypto.randomUUID();
            const recent = await listLocalRuns().catch(() => []);
            const focusChars = mode === 'repair-trial' ? (recent[0]?.result.weakChars ?? ['q', 'p', 'b']) : [];
            const difficulty = settings.reactionAssist ? ('flow' as const) : ('standard' as const);
            // Start the run and the critical assets together: the run is playable once both settle.
            const [response] = await Promise.all([
                api.startRun({ mode, difficulty, clientRunId, focusChars }, controller.signal).catch(() => ({
                    runId: clientRunId,
                    mode,
                    difficulty,
                    seed: mode === 'daily-rift' ? `daily:${new Date().toISOString().slice(0, 10)}:standard` : crypto.randomUUID().replaceAll('-', ''),
                    contentVersion: CONTENT_VERSION,
                    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
                    ticket: 'offline-ticket'
                })),
                loadCriticalAssets(mode, 0)
            ]);
            if (cancelled) return;
            const initial = createRun({
                id: response.runId,
                mode,
                difficulty: mode === 'daily-rift' ? 'standard' : difficulty,
                seed: response.seed,
                focusChars
            });
            const started = dispatchRun(initial, { type: 'start' }).state;
            commandLog.current = [{ atMs: 0, command: { type: 'start' } }];
            publish(started);
            loadWarmAssets(plan);
            cancelIdle = loadIdleAssets(plan);
        })();
        return () => {
            cancelled = true;
            controller.abort();
            cancelIdle?.();
        };
    }, [hasMode, mode, publish, runKey, settings.reactionAssist]);

    const restart = useCallback(() => {
        submitted.current = false;
        commandLog.current = [];
        stateRef.current = null;
        setState(null);
        setRunKey((value) => value + 1);
    }, []);

    useEffect(() => {
        let frame = 0;
        let previous = performance.now();
        let accumulator = 0;
        const loop = (timestamp: number) => {
            const current = stateRef.current;
            accumulator += Math.min(50, timestamp - previous);
            previous = timestamp;
            if (current?.phase === 'running') {
                let next = current;
                let pending: Omit<HudFeedback, 'id'> | null = null;
                while (accumulator >= FIXED_STEP_MS && next.phase === 'running') {
                    const step = tickRun(next, FIXED_STEP_MS);
                    const message = feedbackFromEvents(next, step.state, step.events, t);
                    if (message) pending = message;
                    next = step.state;
                    accumulator -= FIXED_STEP_MS;
                }
                if (next !== current) publish(next);
                if (pending) pushFeedback(pending);
            }
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    }, [publish, pushFeedback, t]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                send(stateRef.current?.phase === 'paused' ? { type: 'resume' } : { type: 'pause' });
                return;
            }
            if (event.key === ' ' && stateRef.current?.energy === 100) {
                event.preventDefault();
                send({ type: 'surge' });
                return;
            }
            if (event.key.length === 1 && /^[a-z0-9?!-]$/i.test(event.key)) {
                event.preventDefault();
                send({ type: 'type', char: event.key });
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [send]);

    useEffect(() => {
        if (!state || state.phase !== 'complete' || submitted.current) return;
        submitted.current = true;
        const result = buildRunResult(state);
        const finalEntries = [...commandLog.current, { atMs: Math.round(state.elapsedMs), command: { type: 'pause' as const } }];
        const payload: CompleteRunRequest = {
            commandLog: {
                contentVersion: CONTENT_VERSION,
                seed: state.seed,
                mode: state.mode,
                difficulty: state.difficulty,
                focusChars: state.focusChars,
                endedAtMs: Math.round(state.elapsedMs),
                entries: finalEntries
            }
        };
        void (async () => {
            await saveLocalRun({ id: state.id, result, completedAt: new Date().toISOString(), verified: false });
            try {
                const response = await api.completeRun(state.id, payload);
                await saveLocalRun({ id: state.id, result: response.run, completedAt: new Date().toISOString(), verified: response.verified });
            } catch {
                await queueCompletion(state.id, payload);
            }
            router.replace(`/debrief/${state.id}`);
        })();
    }, [router, state]);

    const area = state ? (AREAS[state.areaIndex] ?? AREAS[0]) : null;
    const areaLabel = useMemo(() => (area ? t(area.titleKey) : ''), [area, t]);
    const { enhancedContrast, reduceEffects } = settings;
    const theme = useMemo(() => resolveGameTheme({ enhancedContrast, reduceEffects }), [enhancedContrast, reduceEffects]);
    const animate = allowsAmbientMotion({ reduceEffects });

    if (!hasMode)
        return (
            <div className="run-gate run-gate--mode">
                <ModeSelectOverlay
                    allowTouch={coarsePointer}
                    onSelect={(next) => router.replace(`/play?mode=${next}`)}
                    onExit={() => router.replace('/')}
                    t={t}
                />
            </div>
        );
    if (coarsePointer && mode !== 'quick-pulse')
        return (
            <div className="run-gate">
                <div className="run-gate__icon">
                    <Keyboard size={30} />
                </div>
                <h1>{t('play.keyboard')}</h1>
                <p>{t('play.keyboardBody')}</p>
                <button className="tr-button tr-button--primary" onClick={() => router.replace('/play?mode=quick-pulse')}>
                    {t('play.quick')}
                    <ArrowRight size={18} />
                </button>
            </div>
        );
    if (!state || !area)
        return (
            <div className="run-loading">
                <RadioTower size={26} />
                {t('play.loading')}
            </div>
        );

    return (
        <div className={`run-page run-page--${area.id}`} style={{ '--run-background': `url(${area.asset})` } as CSSProperties}>
            <section className="battlefield" aria-label={t('play.battlefield')}>
                <BattleCanvas stateRef={stateRef} theme={theme} animate={animate} />
                <div className="word-layer" aria-label={t('play.targetQueue')}>
                    {state.enemies.map((enemy) => {
                        const targeted = state.currentTargetId === enemy.id;
                        return (
                            <div
                                key={enemy.id}
                                className={`enemy-word${targeted ? ' is-targeted' : ''}${enemy.boss ? ' is-boss' : ''}`}
                                style={{ '--lane': enemy.lane, '--pressure': enemy.pressure } as CSSProperties}
                            >
                                <span className="enemy-name">{enemy.archetypeId.replaceAll('-', ' ')}</span>
                                {/* The targeted word lives in the HUD centre, so the plate only carries identity. */}
                                {targeted ? null : <span className="word">{enemy.word}</span>}
                                {enemy.boss ? (
                                    <span className="enemy-health">
                                        <i style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                                    </span>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
                <div className="sr-only" aria-label={t('play.targetQueue')}>
                    {state.enemies.map((enemy) => `${enemy.word}, ${Math.round(enemy.pressure * 100)}%`).join('. ')}
                </div>
            </section>
            <HudOverlay
                state={state}
                modeLabel={t(`mode.${state.mode}`)}
                areaLabel={areaLabel}
                t={t}
                feedback={feedback}
                onPause={() => send({ type: 'pause' })}
                onSurge={() => send({ type: 'surge' })}
            />
            {mode === 'quick-pulse' ? (
                <input
                    className="mobile-signal-input"
                    aria-label={t('play.signalInput')}
                    inputMode="text"
                    autoCapitalize="off"
                    autoCorrect="off"
                    onChange={(event) => {
                        const character = event.target.value.slice(-1);
                        event.target.value = '';
                        if (/^[a-z0-9?!-]$/i.test(character)) send({ type: 'type', char: character });
                    }}
                />
            ) : null}
            {state.phase === 'upgrade' ? <UpgradeOverlay state={state} choose={(upgradeId) => send({ type: 'choose-upgrade', upgradeId })} t={t} /> : null}
            {state.phase === 'paused' ? (
                <PauseOverlay
                    state={state}
                    resume={() => send({ type: 'resume' })}
                    extract={() => send({ type: 'extract' })}
                    canExtract={state.areaIndex > 0}
                    onRestart={restart}
                    onSettings={openSettings}
                    onExit={() => router.replace('/')}
                    t={t}
                />
            ) : null}
        </div>
    );
}

function BattleCanvas({ stateRef, theme, animate }: { stateRef: MutableRefObject<RunState | null>; theme: GameVisualTheme; animate: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const themeRef = useRef(theme);
    const animateRef = useRef(animate);
    themeRef.current = theme;
    animateRef.current = animate;
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        let frame = 0;
        const render = () => {
            const palette = themeRef.current;
            const rect = canvas.getBoundingClientRect();
            const ratio = Math.min(2, window.devicePixelRatio || 1);
            if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
                canvas.width = Math.round(rect.width * ratio);
                canvas.height = Math.round(rect.height * ratio);
            }
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            context.clearRect(0, 0, rect.width, rect.height);
            const state = stateRef.current;
            if (state) {
                const gradient = context.createRadialGradient(
                    rect.width * 0.5,
                    rect.height * 0.42,
                    10,
                    rect.width * 0.5,
                    rect.height * 0.42,
                    rect.width * 0.45
                );
                gradient.addColorStop(0, palette.background);
                gradient.addColorStop(1, palette.backgroundEdge);
                context.fillStyle = gradient;
                context.fillRect(0, 0, rect.width, rect.height);
                state.enemies.forEach((enemy, index) => {
                    const x = rect.width * (0.18 + enemy.lane * 0.32);
                    const y = rect.height * (0.13 + enemy.pressure * 0.56);
                    const radius = enemy.boss ? 44 : 18 + (index % 3) * 2;
                    const image = getImage(`/game/v1/${enemy.boss ? 'bosses' : 'enemies'}/${enemy.archetypeId}.png`);
                    if (image.complete && image.naturalWidth) {
                        const size = enemy.boss ? 176 : 82;
                        context.drawImage(image, x - size / 2, y - size / 2, size, size);
                        return;
                    }
                    context.save();
                    context.translate(x, y);
                    if (animateRef.current) context.rotate(performance.now() / 3000 + index);
                    const targeted = state.currentTargetId === enemy.id;
                    context.strokeStyle = enemy.boss
                        ? palette.enemyBoss
                        : targeted
                          ? palette.enemyTargeted
                          : enemy.hp < enemy.maxHp
                            ? palette.enemyDamaged
                            : palette.enemyNormal;
                    context.lineWidth = enemy.boss ? 3 : targeted ? 2 : 1.5;
                    context.beginPath();
                    for (let point = 0; point < 6; point += 1) {
                        const angle = (point / 6) * Math.PI * 2;
                        const px = Math.cos(angle) * radius;
                        const py = Math.sin(angle) * radius;
                        if (point === 0) context.moveTo(px, py);
                        else context.lineTo(px, py);
                    }
                    context.closePath();
                    context.stroke();
                    context.restore();
                });
            }
            frame = requestAnimationFrame(render);
        };
        frame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frame);
    }, [stateRef]);
    return <canvas className="battle-canvas" ref={canvasRef} aria-hidden="true" />;
}

function UpgradeOverlay({ state, choose, t }: { state: RunState; choose: (id: string) => void; t: (key: string) => string }) {
    // The recommendation is derived from real signals, so the advice is training, not decoration.
    const recommendedId = state.upgradeChoices.find((upgrade) => upgrade.rarity === 'epic')?.id ?? state.upgradeChoices[0]?.id;
    const reason = state.counters.errors > 0 ? t('upgrade.recommendedWeak') : t('upgrade.recommendedAccuracy');
    // The recommended card is the one primary action on this screen, so it takes focus.
    const recommendedRef = useRef<HTMLButtonElement>(null);
    return (
        <GameDialog
            open
            tone="battle"
            width="wide"
            title={t('play.upgrade')}
            description={`${t('upgrade.level')} ${state.level + 1}`}
            initialFocusRef={recommendedRef}
            dismissOnEscape={false}
        >
            <div className="upgrade-grid">
                {state.upgradeChoices.map((upgrade) => (
                    <button
                        key={upgrade.id}
                        ref={upgrade.id === recommendedId ? recommendedRef : undefined}
                        className={`upgrade-card rarity-${upgrade.rarity}${upgrade.id === recommendedId ? ' is-recommended' : ''}`}
                        onClick={() => choose(upgrade.id)}
                    >
                        <span className="upgrade-icon">
                            <NextImage src={`/game/v1/upgrades/${upgrade.id}.png`} width={58} height={58} alt="" />
                        </span>
                        <span className="upgrade-meta">
                            <span className="upgrade-category">{t(`upgrade.${upgrade.category}`)}</span>
                            <span className={`upgrade-rarity rarity-${upgrade.rarity}`}>{t(`upgrade.rarity.${upgrade.rarity}`)}</span>
                        </span>
                        <strong>{t(`upgrade.${upgrade.id}.title`)}</strong>
                        <p>{t(`upgrade.${upgrade.id}.description`)}</p>
                        {upgrade.id === recommendedId ? <span className="upgrade-badge">{t('upgrade.recommended')}</span> : null}
                        <span className="upgrade-select">
                            {t('upgrade.select')} <ChevronRight size={16} />
                        </span>
                    </button>
                ))}
            </div>
            {recommendedId ? <p className="upgrade-reason">{reason}</p> : null}
        </GameDialog>
    );
}

function PauseOverlay({
    state,
    resume,
    extract,
    canExtract,
    onRestart,
    onSettings,
    onExit,
    t
}: {
    state: RunState;
    resume: () => void;
    extract: () => void;
    canExtract: boolean;
    onRestart: () => void;
    onSettings: () => void;
    onExit: () => void;
    t: (key: string) => string;
}) {
    const elapsed = formatTime(state.elapsedMs);
    const accuracy = state.counters.typed > 0 ? Math.round((state.counters.correct / state.counters.typed) * 1000) / 10 : 100;
    return (
        <GameDialog
            open
            tone="battle"
            title={t('play.pause')}
            description={`${elapsed} · ${t('play.area')} ${state.areaIndex + 1} · ${t('play.accuracy')} ${accuracy}%`}
            // Escape is owned by the run itself, so it always means "resume".
            dismissOnEscape={false}
        >
            <GameButton block icon={<Play size={18} />} shortcut="Esc" onClick={resume}>
                {t('play.resume')}
            </GameButton>
            {canExtract ? (
                <GameButton block tone="quiet" icon={<LogOut size={18} />} onClick={extract}>
                    {t('play.extract')}
                </GameButton>
            ) : null}
            <div className="pause-panel__secondary">
                <GameButton tone="ghost" icon={<RotateCcw size={16} />} onClick={onRestart}>
                    {t('play.restart')}
                </GameButton>
                <GameButton tone="ghost" icon={<SettingsIcon size={16} />} onClick={onSettings}>
                    {t('nav.settings')}
                </GameButton>
                <GameButton tone="ghost" icon={<Gauge size={16} />} onClick={onExit}>
                    {t('play.exit')}
                </GameButton>
            </div>
        </GameDialog>
    );
}
