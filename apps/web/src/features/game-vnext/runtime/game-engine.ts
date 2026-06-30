import {
    buildGameResult,
    buildGameSnapshot,
    createGameState,
    dispatchGameCommand,
    updateGameState
} from '@typemaster/domain';

export type GameMode = 'expedition' | 'daily-anomaly' | 'first-descent';
export type GameCommand = 'start' | 'pause' | 'resume' | 'retry' | 'quit' | 'extract' | 'type-char' | 'choose-upgrade';

export interface GameEngineOptions {
    language?: string;
    seed?: string;
    focusChars?: string[];
    wordPool?: string[];
    gameMode?: GameMode;
}

export interface GameEngineUpdate {
    snapshot: any;
    events: any[];
}

export interface GameEngine {
    readonly state: any;
    readonly snapshot: any;
    tick(deltaTime: number): GameEngineUpdate;
    dispatch(command: GameCommand, payload?: Record<string, unknown>): GameEngineUpdate;
    handleKey(event: KeyboardEvent): GameEngineUpdate;
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

export function createGameEngine(options: GameEngineOptions = {}): GameEngine {
    let engineOptions: GameEngineOptions = {
        language: 'zh-CN',
        gameMode: 'expedition',
        seed: `typerift-${todaySeed()}`,
        focusChars: [],
        ...options
    };
    let state = createGameState(engineOptions);
    let snapshot = buildGameSnapshot(state);

    function refresh(events: any[] = []): GameEngineUpdate {
        snapshot = buildGameSnapshot(state);
        return { snapshot, events };
    }

    function dispatch(command: GameCommand, payload: Record<string, unknown> = {}): GameEngineUpdate {
        if (command === 'start' || command === 'retry') {
            const nextMode = (payload.gameMode || payload.mode || engineOptions.gameMode || 'expedition') as GameMode;
            engineOptions = {
                ...engineOptions,
                ...payload,
                gameMode: nextMode,
                seed: (payload.seed as string) || (
                    nextMode === 'daily-anomaly'
                        ? `daily-anomaly-${todaySeed()}`
                        : nextMode === 'first-descent'
                            ? `first-descent-${todaySeed()}`
                            : `expedition-${Date.now().toString(36)}`
                )
            };
        }

        const result = dispatchGameCommand(state, command, {
            ...engineOptions,
            ...payload,
            gameMode: (payload.gameMode || payload.mode || engineOptions.gameMode) as GameMode
        });
        state = result.state;
        return refresh(result.events);
    }

    function tick(deltaTime: number): GameEngineUpdate {
        const result = updateGameState(state, deltaTime);
        state = result.state;
        return refresh(result.events);
    }

    function handleKey(event: KeyboardEvent): GameEngineUpdate {
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
            return dispatch('start', { gameMode: 'expedition' });
        }

        if (/^[123]$/.test(key) && state.phase === 'playing' && state.upgradeChoices?.length) {
            event.preventDefault();
            const index = Number(key) - 1;
            return dispatch('choose-upgrade', { upgradeId: state.upgradeChoices[index]?.id });
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
        getResult() {
            return buildGameResult(state);
        },
        destroy() {}
    };
}

