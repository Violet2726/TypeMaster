import { describe, expect, it } from 'vitest';
import { applyPracticeCommand, buildRunResult, createPractice } from './engine';
import { getPassage } from './content';

describe('practice session', () => {
    it('uses safe defaults for unsupported durations and passage ids', () => {
        expect(createPractice('defaults', 45_000).durationMs).toBe(60_000);
        expect(getPassage('unknown-passage')).toEqual(getPassage('morning-light'));
    });

    it('starts with the first keystroke and tracks accuracy', () => {
        const state = createPractice('stable-seed', 30_000, 'morning-light');
        const correct = applyPracticeCommand(state, { type: 'type', text: 'T' });
        const incorrect = applyPracticeCommand(correct.state, { type: 'type', text: 'x' });

        expect(correct.state.phase).toBe('running');
        expect(incorrect.state.typed).toBe('Tx');
        expect(incorrect.state.attemptedChars).toBe(2);
        expect(incorrect.state.correctChars).toBe(1);
        expect(incorrect.state.errors).toBe(1);
        expect(incorrect.state.currentStreak).toBe(0);
    });

    it('allows corrections without removing keystrokes from the final metrics', () => {
        const started = applyPracticeCommand(createPractice('edit', 30_000, 'morning-light'), { type: 'type', text: 't' }).state;
        const erased = applyPracticeCommand(started, { type: 'backspace' }).state;
        const corrected = applyPracticeCommand(erased, { type: 'type', text: 'T' }).state;

        expect(corrected.typed).toBe('T');
        expect(corrected.attemptedChars).toBe(2);
        expect(corrected.errors).toBe(1);
    });

    it('ignores empty, paused, and completed input and blocks overtyping a mistaken final character', () => {
        const initial = createPractice('edges', 30_000, 'morning-light');
        expect(applyPracticeCommand(initial, { type: 'type', text: '' }).state).toBe(initial);

        const text = getPassage(initial.passageId).text;
        const finalError = applyPracticeCommand(initial, { type: 'type', text: `${text.slice(0, -1)}x` }).state;
        expect(finalError.typed).toHaveLength(text.length);
        expect(finalError.errors).toBe(1);

        const extraInput = applyPracticeCommand(finalError, { type: 'type', text: 'z' });
        expect(extraInput.state).toBe(finalError);
        expect(extraInput.state.attemptedChars).toBe(text.length);

        const paused = applyPracticeCommand(finalError, { type: 'pause' }).state;
        expect(applyPracticeCommand(paused, { type: 'type', text: 'T' }).state).toBe(paused);
        const complete = applyPracticeCommand(finalError, { type: 'tick', deltaMs: 30_000 }).state;
        expect(applyPracticeCommand(complete, { type: 'type', text: 'T' }).state).toBe(complete);
    });

    it('completes the passage, continues with the next one, and pauses the clock', () => {
        const state = createPractice('passage', 30_000, 'morning-light');
        const completeText = applyPracticeCommand(state, { type: 'type', text: getPassage(state.passageId).text });
        expect(completeText.state.completedPassages).toBe(1);
        expect(completeText.state.passageId).not.toBe('morning-light');

        const paused = applyPracticeCommand(completeText.state, { type: 'pause' }).state;
        expect(applyPracticeCommand(paused, { type: 'tick', deltaMs: 15_000 }).state.elapsedMs).toBe(0);
        expect(applyPracticeCommand(paused, { type: 'resume' }).state.phase).toBe('running');
    });

    it('ends at the selected duration and summarizes weak keys', () => {
        const state = createPractice('metrics', 30_000, 'morning-light');
        const typed = applyPracticeCommand(state, { type: 'type', text: 'Tz' }).state;
        const finished = applyPracticeCommand(typed, { type: 'tick', deltaMs: 30_000 }).state;
        const result = buildRunResult(finished);

        expect(finished.phase).toBe('complete');
        expect(result.weakKeys).toEqual([{ key: 'z', mistakes: 1 }]);
        expect(result.accuracy).toBe(50);
    });

    it('handles no-op backspace, pause, resume, and invalid clock commands', () => {
        const ready = createPractice('no-ops', 30_000, 'morning-light');
        expect(applyPracticeCommand(ready, { type: 'backspace' }).state).toBe(ready);
        expect(applyPracticeCommand(ready, { type: 'pause' }).state).toBe(ready);
        expect(applyPracticeCommand(ready, { type: 'resume' }).state).toBe(ready);
        expect(applyPracticeCommand(ready, { type: 'tick', deltaMs: 1_000 }).state).toBe(ready);

        const running = applyPracticeCommand(ready, { type: 'type', text: 'T' }).state;
        expect(applyPracticeCommand(running, { type: 'resume' }).state).toBe(running);
        expect(applyPracticeCommand(running, { type: 'tick', deltaMs: 0 }).state).toBe(running);
        expect(applyPracticeCommand(running, { type: 'tick', deltaMs: Number.NaN }).state).toBe(running);

        const emptyInput = applyPracticeCommand(running, { type: 'backspace' }).state;
        expect(emptyInput.typed).toBe('');
        expect(applyPracticeCommand(emptyInput, { type: 'backspace' }).state).toBe(emptyInput);
        const paused = applyPracticeCommand(running, { type: 'pause' }).state;
        expect(applyPracticeCommand(paused, { type: 'pause' }).state).toBe(paused);
        expect(applyPracticeCommand(paused, { type: 'resume' }).state.phase).toBe('running');
    });

    it('reports zero speed and accuracy before any input', () => {
        const result = buildRunResult(createPractice('empty-result', 60_000, 'morning-light'));
        expect(result.wpm).toBe(0);
        expect(result.accuracy).toBe(0);
        expect(result.weakKeys).toEqual([]);
    });

    it('is deterministic for the same seed and command sequence', () => {
        const commands = [
            { type: 'type', text: 'The' },
            { type: 'type', text: ' x' },
            { type: 'tick', deltaMs: 12_500 }
        ] as const;
        const run = () => commands.reduce((state, command) => applyPracticeCommand(state, command).state, createPractice('same', 30_000));
        expect(run()).toEqual(run());
    });
});
