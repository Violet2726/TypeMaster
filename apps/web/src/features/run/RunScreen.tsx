'use client';

import type { CSSProperties, MutableRefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, ArrowRight, ChevronRight, CirclePause, Gauge, Keyboard, LogOut, Pause, Play, RadioTower, Sparkles, Zap } from 'lucide-react';
import {
    AREAS,
    buildRunResult,
    createRun,
    dispatchRun,
    hashRunResult,
    tickRun,
    type ReplayEntry,
    type RunCommand,
    type RunMode,
    type RunState
} from '@typerift/domain';
import type { CompleteRunRequest, RunResultContract } from '@typerift/contracts';
import { api } from '../../lib/api';
import { listLocalRuns, queueCompletion, saveLocalRun } from '../../lib/storage';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';

const VALID_MODES = new Set<RunMode>(['first-rift', 'expedition', 'daily-rift', 'repair-trial', 'quick-pulse']);
const FIXED_STEP_MS = 1000 / 60;
const spriteCache = new Map<string, HTMLImageElement>();

function modeFrom(value: string | null): RunMode {
    return VALID_MODES.has(value as RunMode) ? (value as RunMode) : 'expedition';
}
function modeLabel(mode: RunMode) {
    return { 'first-rift': 'First Rift', expedition: 'Expedition', 'daily-rift': 'Daily Rift', 'repair-trial': 'Repair Trial', 'quick-pulse': 'Quick Pulse' }[
        mode
    ];
}
function formatTime(milliseconds: number) {
    const total = Math.max(0, Math.ceil(milliseconds / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
function sprite(path: string) {
    const cached = spriteCache.get(path);
    if (cached) return cached;
    const image = new Image();
    image.decoding = 'async';
    image.src = path;
    spriteCache.set(path, image);
    return image;
}

export function RunScreen() {
    const router = useRouter();
    const params = useSearchParams();
    const mode = modeFrom(params.get('mode'));
    const settings = useUiStore((store) => store.settings);
    const t = (key: string) => translate(settings.locale, key);
    const [state, setState] = useState<RunState | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const [coarsePointer, setCoarsePointer] = useState(false);
    const stateRef = useRef<RunState | null>(null);
    const commandLog = useRef<ReplayEntry[]>([]);
    const submitted = useRef(false);
    const music = useRef<HTMLAudioElement | null>(null);

    const publish = useCallback((next: RunState) => {
        stateRef.current = next;
        setState(next);
    }, []);
    const sound = useCallback(
        (kind: 'hit' | 'error' | 'surge') => {
            if (!settings.effects) return;
            const effect = new Audio(`/game/v1/audio/${kind}.wav`);
            effect.volume = 0.42;
            void effect.play().catch(() => undefined);
            if (settings.music && !music.current) {
                const ambient = new Audio('/game/v1/audio/ambient-loop.wav');
                ambient.loop = true;
                ambient.volume = 0.12;
                music.current = ambient;
                void ambient.play().catch(() => undefined);
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
            const event = applied.events.at(-1);
            if (event?.type === 'error') {
                sound('error');
                setAnnouncement(`Fracture increased. ${String(event.value)}`);
            } else if (event?.type === 'surge') {
                sound('surge');
                setAnnouncement('Surge released.');
            } else if (event?.type === 'typed' || event?.type === 'defeated') sound('hit');
        },
        [publish, sound]
    );

    useEffect(() => {
        setCoarsePointer(window.matchMedia('(pointer: coarse)').matches);
        let cancelled = false;
        void (async () => {
            const clientRunId = crypto.randomUUID();
            const recent = await listLocalRuns().catch(() => []);
            const focusChars = mode === 'repair-trial' ? (recent[0]?.result.weakChars ?? ['q', 'p', 'b']) : [];
            const response = await api.startRun({ mode, difficulty: settings.reactionAssist ? 'flow' : 'standard', clientRunId, focusChars }).catch(() => ({
                runId: clientRunId,
                mode,
                seed: mode === 'daily-rift' ? `daily:${new Date().toISOString().slice(0, 10)}:standard` : crypto.randomUUID().replaceAll('-', ''),
                contentVersion: 1 as const,
                expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
                signature: 'offline'
            }));
            if (cancelled) return;
            const initial = createRun({
                id: response.runId,
                mode,
                difficulty: mode === 'daily-rift' ? 'standard' : settings.reactionAssist ? 'flow' : 'standard',
                seed: response.seed,
                focusChars
            });
            const started = dispatchRun(initial, { type: 'start' }).state;
            commandLog.current = [{ atMs: 0, command: { type: 'start' } }];
            publish(started);
        })();
        return () => {
            cancelled = true;
        };
    }, [mode, publish, settings.reactionAssist]);

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
                while (accumulator >= FIXED_STEP_MS && next.phase === 'running') {
                    next = tickRun(next, FIXED_STEP_MS).state;
                    accumulator -= FIXED_STEP_MS;
                }
                if (next !== current) publish(next);
            }
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    }, [publish]);

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
            if (event.key.length === 1 && /^[a-z0-9]$/i.test(event.key)) {
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
        const result = buildRunResult(state) as RunResultContract;
        const finalEntries = [...commandLog.current, { atMs: Math.round(state.elapsedMs), command: { type: 'pause' as const } }];
        const payload: CompleteRunRequest = {
            commandLog: {
                contentVersion: 1,
                seed: state.seed,
                mode: state.mode,
                difficulty: state.difficulty,
                focusChars: state.focusChars,
                entries: finalEntries
            },
            result,
            clientHash: hashRunResult(result)
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
    if (!state)
        return (
            <div className="run-loading">
                <RadioTower size={26} />
                {t('play.loading')}
            </div>
        );
    const area = AREAS[state.areaIndex] ?? AREAS[0];
    const remaining = state.durationMs - state.elapsedMs;
    return (
        <div className={`run-page run-page--${area.id}`} style={{ '--run-background': `url(${area.asset})` } as CSSProperties}>
            <header className="run-hud glass-control">
                <div className="run-identity">
                    <span>{modeLabel(state.mode)}</span>
                    <strong>{area.titleKey.split('.').at(-1)?.replace('-', ' ')}</strong>
                </div>
                <div className="hud-metrics">
                    <div>
                        <span>{t('play.area')}</span>
                        <strong>{state.areaIndex + 1} / 3</strong>
                    </div>
                    <div>
                        <span>{t('play.wave')}</span>
                        <strong>{state.wave} / 3</strong>
                    </div>
                    <div className="timer">
                        <span>Time</span>
                        <strong>{formatTime(remaining)}</strong>
                    </div>
                    <div>
                        <span>Score</span>
                        <strong>{state.score.toLocaleString()}</strong>
                    </div>
                </div>
                <button className="icon-button" aria-label="Pause" onClick={() => send({ type: 'pause' })}>
                    <Pause size={18} />
                </button>
            </header>
            <section className="battlefield" aria-label="Combat field">
                <BattleCanvas stateRef={stateRef} />
                <div className="word-layer" aria-label="Target queue">
                    {state.enemies.map((enemy) => (
                        <div
                            key={enemy.id}
                            className={`enemy-word${state.currentTargetId === enemy.id ? ' is-targeted' : ''}${enemy.boss ? ' is-boss' : ''}`}
                            style={{ '--lane': enemy.lane, '--pressure': enemy.pressure } as CSSProperties}
                        >
                            <span className="enemy-name">{enemy.archetypeId.replaceAll('-', ' ')}</span>
                            <span className="word">
                                <span>{enemy.typed}</span>
                                {enemy.word.slice(enemy.typed.length)}
                            </span>
                            {enemy.boss ? (
                                <span className="enemy-health">
                                    <i style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                                </span>
                            ) : null}
                        </div>
                    ))}
                </div>
                {state.enemies.length === 0 ? (
                    <div className="signal-calm">
                        <Activity size={20} />
                        <span>Awaiting signal</span>
                    </div>
                ) : null}
                <div className="sr-only" aria-live="polite">
                    {announcement}
                </div>
                <div className="sr-only" aria-label="Screen reader target queue">
                    {state.enemies.map((enemy) => `${enemy.word}, ${Math.round(enemy.pressure * 100)} percent pressure`).join('. ')}
                </div>
            </section>
            <footer className="combat-controls glass-control">
                <div className="meter-block">
                    <div className="meter-label">
                        <span>{t('play.fracture')}</span>
                        <strong>{Math.round(state.fracture)}%</strong>
                    </div>
                    <div className="meter meter--fracture">
                        <span style={{ width: `${state.fracture}%` }} />
                    </div>
                </div>
                <div className="combo-readout">
                    <span>Combo</span>
                    <strong>{state.combo}</strong>
                </div>
                <div className="meter-block">
                    <div className="meter-label">
                        <span>{t('play.energy')}</span>
                        <strong>{Math.round(state.energy)}%</strong>
                    </div>
                    <div className="meter meter--energy">
                        <span style={{ width: `${state.energy}%` }} />
                    </div>
                </div>
                <button className="surge-button" disabled={state.energy < 100} onClick={() => send({ type: 'surge' })}>
                    <Zap size={20} />
                    <span>{t('play.surge')}</span>
                    <kbd>Space</kbd>
                </button>
            </footer>
            {mode === 'quick-pulse' ? (
                <input
                    className="mobile-signal-input"
                    aria-label="Type signal"
                    inputMode="text"
                    autoCapitalize="off"
                    autoCorrect="off"
                    onChange={(event) => {
                        const character = event.target.value.slice(-1);
                        event.target.value = '';
                        if (/^[a-z0-9]$/i.test(character)) send({ type: 'type', char: character });
                    }}
                />
            ) : null}
            {state.phase === 'upgrade' ? (
                <UpgradeOverlay state={state} choose={(upgradeId) => send({ type: 'choose-upgrade', upgradeId })} title={t('play.upgrade')} />
            ) : null}
            {state.phase === 'paused' ? (
                <PauseOverlay resume={() => send({ type: 'resume' })} extract={() => send({ type: 'extract' })} canExtract={state.areaIndex > 0} t={t} />
            ) : null}
        </div>
    );
}

function BattleCanvas({ stateRef }: { stateRef: MutableRefObject<RunState | null> }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        let frame = 0;
        const render = () => {
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
                gradient.addColorStop(0, 'rgba(126, 214, 255, .18)');
                gradient.addColorStop(1, 'rgba(8, 12, 24, 0)');
                context.fillStyle = gradient;
                context.fillRect(0, 0, rect.width, rect.height);
                state.enemies.forEach((enemy, index) => {
                    const x = rect.width * (0.18 + enemy.lane * 0.32);
                    const y = rect.height * (0.13 + enemy.pressure * 0.56);
                    const radius = enemy.boss ? 44 : 18 + (index % 3) * 2;
                    const image = sprite(`/game/v1/${enemy.boss ? 'bosses' : 'enemies'}/${enemy.archetypeId}.png`);
                    if (image.complete && image.naturalWidth) {
                        const size = enemy.boss ? 176 : 82;
                        context.drawImage(image, x - size / 2, y - size / 2, size, size);
                        return;
                    }
                    context.save();
                    context.translate(x, y);
                    context.rotate(performance.now() / 3000 + index);
                    context.strokeStyle = enemy.boss ? 'rgba(255, 195, 113, .9)' : 'rgba(143, 223, 255, .75)';
                    context.lineWidth = enemy.boss ? 3 : 1.5;
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

function UpgradeOverlay({ state, choose, title }: { state: RunState; choose: (id: string) => void; title: string }) {
    return (
        <div className="overlay-layer">
            <section className="upgrade-panel" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
                <p className="eyebrow">
                    <Sparkles size={16} />
                    Level {state.level + 1}
                </p>
                <h2 id="upgrade-title">{title}</h2>
                <div className="upgrade-grid">
                    {state.upgradeChoices.map((upgrade, index) => (
                        <button key={upgrade.id} className={`upgrade-card rarity-${upgrade.rarity}`} autoFocus={index === 0} onClick={() => choose(upgrade.id)}>
                            <span className="upgrade-icon">
                                <NextImage src={`/game/v1/upgrades/${upgrade.id}.png`} width={58} height={58} alt="" />
                            </span>
                            <span className="upgrade-category">{upgrade.category}</span>
                            <strong>{upgrade.id.replaceAll('-', ' ')}</strong>
                            <p>{upgrade.descriptionKey}</p>
                            <span className="upgrade-select">
                                Select <ChevronRight size={16} />
                            </span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

function PauseOverlay({ resume, extract, canExtract, t }: { resume: () => void; extract: () => void; canExtract: boolean; t: (key: string) => string }) {
    return (
        <div className="overlay-layer">
            <section className="pause-panel glass-control" role="dialog" aria-modal="true" aria-labelledby="pause-title">
                <CirclePause size={30} />
                <h2 id="pause-title">{t('play.pause')}</h2>
                <button autoFocus className="tr-button tr-button--primary" onClick={resume}>
                    <Play size={18} />
                    {t('play.resume')}
                </button>
                {canExtract ? (
                    <button className="tr-button tr-button--secondary" onClick={extract}>
                        <LogOut size={18} />
                        {t('play.extract')}
                    </button>
                ) : null}
                <p>
                    <Gauge size={14} /> Esc
                </p>
            </section>
        </div>
    );
}
