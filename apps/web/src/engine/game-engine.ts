import {
    buildRaidResult,
    buildRaidSnapshot,
    createRaidState,
    dispatchRaidCommand,
    updateRaidState
} from '@typemaster/domain';

export type RaidPhase = 'idle' | 'playing' | 'paused' | 'gameover';
export type RaidMode = 'endless-rift' | 'daily-mutation' | 'first-breach';
export type RaidCommand = 'start' | 'pause' | 'resume' | 'retry' | 'quit' | 'extract' | 'type-char' | 'choose-relic';

export interface RaidEngineOptions {
    language?: string;
    seed?: string;
    focusChars?: string[];
    wordPool?: string[];
    raidMode?: RaidMode;
}

export interface RaidEngineUpdate {
    snapshot: any;
    events: any[];
}

export interface GameEngine {
    readonly state: any;
    readonly snapshot: any;
    tick(deltaTime: number): RaidEngineUpdate;
    dispatch(command: RaidCommand, payload?: Record<string, unknown>): RaidEngineUpdate;
    handleKey(event: KeyboardEvent): RaidEngineUpdate;
    resize(width: number, height: number): void;
    getResult(): any;
    destroy(): void;
}

function normalizeChar(key: string) {
    if (key.length !== 1) return '';
    return key.toLowerCase();
}

function todaySeed() {
    return new Date().toISOString().slice(0, 10);
}

export function createGameEngine(options: RaidEngineOptions = {}): GameEngine {
    let width = 800;
    let height = 600;
    let engineOptions: RaidEngineOptions = {
        language: 'zh-CN',
        raidMode: 'endless-rift',
        seed: `rift-${todaySeed()}`,
        focusChars: [],
        ...options
    };
    let state = createRaidState(engineOptions);
    let snapshot = buildRaidSnapshot(state);

    function refresh(events: any[] = []): RaidEngineUpdate {
        snapshot = buildRaidSnapshot(state);
        return { snapshot, events };
    }

    function dispatch(command: RaidCommand, payload: Record<string, unknown> = {}): RaidEngineUpdate {
        if (command === 'start' || command === 'retry') {
            engineOptions = {
                ...engineOptions,
                ...payload,
                raidMode: (payload.raidMode as RaidMode) || engineOptions.raidMode || 'endless-rift',
                seed: (payload.seed as string) || (
                    payload.raidMode === 'daily-mutation'
                        ? `daily-${todaySeed()}`
                        : payload.raidMode === 'first-breach'
                            ? `first-breach-${todaySeed()}`
                            : `rift-${Date.now().toString(36)}`
                )
            };
        }

        const result = dispatchRaidCommand(state, command, {
            ...engineOptions,
            ...payload
        });
        state = result.state;
        return refresh(result.events);
    }

    function tick(deltaTime: number): RaidEngineUpdate {
        const result = updateRaidState(state, deltaTime);
        state = result.state;
        return refresh(result.events);
    }

    function handleKey(event: KeyboardEvent): RaidEngineUpdate {
        const key = event.key;

        if (key === 'Escape') {
            if (state.phase === 'playing') {
                event.preventDefault();
                return dispatch('pause');
            }
            if (state.phase === 'paused') {
                event.preventDefault();
                return dispatch('resume');
            }
        }

        if (key === 'Enter' && state.phase === 'idle') {
            event.preventDefault();
            return dispatch('start', { raidMode: 'endless-rift' });
        }

        if (/^[123]$/.test(key) && state.phase === 'playing' && state.relicChoices?.length) {
            event.preventDefault();
            const index = Number(key) - 1;
            return dispatch('choose-relic', { relicId: state.relicChoices[index]?.id });
        }

        if ((key === 'r' || key === 'R') && state.phase === 'gameover') {
            event.preventDefault();
            return dispatch('retry');
        }

        const char = normalizeChar(key);
        if (char && state.phase === 'playing') {
            event.preventDefault();
            return dispatch('type-char', { char });
        }

        return refresh([]);
    }

    return {
        get state() {
            return state;
        },
        get snapshot() {
            return snapshot;
        },
        tick,
        dispatch,
        handleKey,
        resize(nextWidth: number, nextHeight: number) {
            width = nextWidth;
            height = nextHeight;
        },
        getResult() {
            return buildRaidResult(state);
        },
        destroy() {
            width = 0;
            height = 0;
        }
    };
}
