import { GAME_PHASES, getGameCopy } from './content.js';
import { startGameState, createGameState } from './state.js';
import { processGameInput } from './combat.js';
import { chooseUpgrade } from './upgrades.js';
import { finishRun, isExtractAvailable } from './scoring.js';

export function dispatchGameCommand(state, command, payload = {}) {
    const type = String(command || '');
    const copy = getGameCopy(state.language || payload.language);

    if (type === 'start' || type === 'retry') {
        const nextState = startGameState(state, payload);
        return { state: nextState, events: [{ type: type === 'retry' ? 'game_retried' : 'game_started', mode: nextState.mode }] };
    }

    if (type === 'pause' && state.phase === GAME_PHASES.playing) {
        return { state: { ...state, phase: GAME_PHASES.paused, liveMessage: copy.paused }, events: [{ type: 'game_paused' }] };
    }

    if (type === 'resume' && state.phase === GAME_PHASES.paused) {
        return { state: { ...state, phase: GAME_PHASES.playing, liveMessage: copy.title }, events: [{ type: 'game_resumed' }] };
    }

    if (type === 'quit') {
        return {
            state: createGameState({
                language: state.language,
                gameMode: state.mode,
                wordPool: state.wordPool,
                focusChars: state.focusChars
            }),
            events: [{ type: 'game_quit' }]
        };
    }

    if (type === 'extract' && state.phase === GAME_PHASES.playing) {
        if (!isExtractAvailable(state)) {
            return { state: { ...state, liveMessage: copy.extractLocked }, events: [{ type: 'extract_locked' }] };
        }
        return { state: finishRun(state, 'extract', 'area-gate'), events: [{ type: 'game_ended', endReason: 'extract' }] };
    }

    if (type === 'type-char') return processGameInput(state, payload.char);
    if (type === 'choose-upgrade') return chooseUpgrade(state, payload.upgradeId || payload.index);

    return { state, events: [] };
}

