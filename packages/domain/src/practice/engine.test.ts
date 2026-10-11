import { describe, expect, it } from 'vitest';
import { applyPracticeCommand, buildRunResult, createPractice } from './engine';
import { getPassage } from './content';

describe('practice session', () => {
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
