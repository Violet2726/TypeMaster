import { getPassage, PRACTICE_PASSAGES } from './content';
import type { PracticeCommand, PracticeEvent, PracticeState, PracticeUpdate, RunResult } from './types';

export const SESSION_DURATIONS_MS = [30_000, 60_000, 120_000] as const;

function passageIndexForSeed(seed: string) {
    let hash = 2166136261;
    for (const character of seed) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash) % PRACTICE_PASSAGES.length;
}

export function createPractice(seed: string, durationMs = 60_000, passageId?: string): PracticeState {
    const passage = passageId ? getPassage(passageId) : PRACTICE_PASSAGES[passageIndexForSeed(seed)]!;
    return {
        seed,
        phase: 'ready',
        durationMs: SESSION_DURATIONS_MS.includes(durationMs as (typeof SESSION_DURATIONS_MS)[number]) ? durationMs : 60_000,
        elapsedMs: 0,
        passageId: passage.id,
        typed: '',
        attemptedChars: 0,
        correctChars: 0,
        errors: 0,
        currentStreak: 0,
        maxStreak: 0,
        completedPassages: 0,
        mistakesByKey: {}
    };
}

function nextPassageId(currentPassageId: string) {
    const currentIndex = PRACTICE_PASSAGES.findIndex((passage) => passage.id === currentPassageId);
    return PRACTICE_PASSAGES[(currentIndex + 1) % PRACTICE_PASSAGES.length]!.id;
}

function typeText(state: PracticeState, text: string): PracticeUpdate {
    if (state.phase === 'paused' || state.phase === 'complete' || !text) return { state, events: [] };

    let next = state;
    const events: PracticeEvent[] = [];
    for (const character of text) {
        if (next.phase === 'ready') {
            next = { ...next, phase: 'running' };
            events.push({ type: 'started' });
        }

        const passage = getPassage(next.passageId);
        if (next.typed.length >= passage.text.length) break;
        const expected = passage.text[next.typed.length]!;
        const attemptedChars = next.attemptedChars + 1;
        if (character === expected) {
            const typed = next.typed + character;
            const currentStreak = next.currentStreak + 1;
            events.push({ type: 'correct-character', character });
            if (typed.length === passage.text.length) {
                events.push({ type: 'passage-completed', passageId: passage.id });
                next = {
                    ...next,
                    typed: '',
                    passageId: nextPassageId(passage.id),
                    attemptedChars,
                    correctChars: next.correctChars + 1,
                    currentStreak,
                    maxStreak: Math.max(next.maxStreak, currentStreak),
                    completedPassages: next.completedPassages + 1
                };
            } else {
                next = {
                    ...next,
                    typed,
                    attemptedChars,
                    correctChars: next.correctChars + 1,
                    currentStreak,
                    maxStreak: Math.max(next.maxStreak, currentStreak)
                };
            }
        } else {
            const key = character.toLowerCase();
            events.push({ type: 'mistake', expected, entered: character });
            next = {
                ...next,
                typed: next.typed + character,
                attemptedChars,
                errors: next.errors + 1,
                currentStreak: 0,
                mistakesByKey: { ...next.mistakesByKey, [key]: (next.mistakesByKey[key] ?? 0) + 1 }
            };
        }
    }
    return { state: next, events };
}

function tick(state: PracticeState, deltaMs: number): PracticeUpdate {
    if (state.phase !== 'running' || !Number.isFinite(deltaMs) || deltaMs <= 0) return { state, events: [] };
    const elapsedMs = Math.min(state.durationMs, state.elapsedMs + deltaMs);
    if (elapsedMs >= state.durationMs) {
        return { state: { ...state, elapsedMs, phase: 'complete' }, events: [{ type: 'completed' }] };
    }
    return { state: { ...state, elapsedMs }, events: [] };
}

export function applyPracticeCommand(state: PracticeState, command: PracticeCommand): PracticeUpdate {
    switch (command.type) {
        case 'type':
            return typeText(state, command.text);
        case 'backspace':
            if (state.phase !== 'running' || state.typed.length === 0) return { state, events: [] };
            return { state: { ...state, typed: state.typed.slice(0, -1) }, events: [] };
        case 'tick':
            return tick(state, command.deltaMs);
        case 'pause':
            return state.phase === 'running' ? { state: { ...state, phase: 'paused' }, events: [{ type: 'paused' }] } : { state, events: [] };
        case 'resume':
            return state.phase === 'paused' ? { state: { ...state, phase: 'running' }, events: [{ type: 'resumed' }] } : { state, events: [] };
    }
}

export function buildRunResult(state: PracticeState): RunResult {
    const minutes = state.elapsedMs / 60_000;
    const weakKeys = Object.entries(state.mistakesByKey)
        .map(([key, mistakes]) => ({ key, mistakes }))
        .sort((left, right) => right.mistakes - left.mistakes || left.key.localeCompare(right.key))
        .slice(0, 4);
    return {
        durationMs: state.durationMs,
        elapsedMs: state.elapsedMs,
        wpm: minutes > 0 ? Math.round(state.correctChars / 5 / minutes) : 0,
        accuracy: state.attemptedChars ? Math.round((state.correctChars / state.attemptedChars) * 100) : 0,
        typedChars: state.attemptedChars,
        correctChars: state.correctChars,
        errors: state.errors,
        maxStreak: state.maxStreak,
        completedPassages: state.completedPassages,
        weakKeys
    };
}
