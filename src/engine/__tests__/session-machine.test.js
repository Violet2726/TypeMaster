import {
    createEmptyTimeline,
    computeNextWordState,
    computeElapsedMs,
    isSessionComplete,
    commitWord,
    handleBackspace,
    calculatePauseSecond,
    shouldAddPauseMoment,
    computePausedDuration,
    computeTimerDisplay,
    validateTransition,
    calculateCorrectKeystrokes
} from '../session-machine';

describe('session-machine', () => {
    describe('createEmptyTimeline', () => {
        it('should create empty timeline with all properties', () => {
            const timeline = createEmptyTimeline();
            expect(timeline.samples).toEqual([]);
            expect(timeline.labels).toEqual([]);
            expect(timeline.wpm).toEqual([]);
            expect(timeline.raw).toEqual([]);
            expect(timeline.accuracy).toEqual([]);
            expect(timeline.burst).toEqual([]);
            expect(timeline.errors).toEqual([]);
            expect(timeline.pauseMoments).toEqual([]);
        });
    });

    describe('computeNextWordState', () => {
        const words = ['hello', 'world'];

        it('should return null when currentInput is empty', () => {
            expect(computeNextWordState('', 0, words, [])).toBeNull();
        });

        it('should return null when currentWordIndex is beyond words length', () => {
            expect(computeNextWordState('hello', 2, words, [])).toBeNull();
        });

        it('should compute next state correctly', () => {
            const result = computeNextWordState('hello', 0, words, []);
            expect(result).toEqual({
                nextHistory: ['hello'],
                nextWordIndex: 1
            });
        });

        it('should append to existing history', () => {
            const result = computeNextWordState('world', 1, words, ['hello']);
            expect(result).toEqual({
                nextHistory: ['hello', 'world'],
                nextWordIndex: 2
            });
        });
    });

    describe('computeElapsedMs', () => {
        const nowMs = 10000;

        it('should return 0 when startedAt is null', () => {
            expect(computeElapsedMs(null, null, null, 0, 'idle', nowMs)).toBe(0);
        });

        it('should compute elapsed for running state', () => {
            expect(computeElapsedMs(5000, null, null, 0, 'running', nowMs)).toBe(5000);
        });

        it('should compute elapsed for paused state', () => {
            expect(computeElapsedMs(5000, null, 8000, 0, 'paused', nowMs)).toBe(3000);
        });

        it('should compute elapsed for complete state', () => {
            expect(computeElapsedMs(5000, 9000, null, 0, 'complete', nowMs)).toBe(4000);
        });

        it('should subtract pausedDurationMs', () => {
            expect(computeElapsedMs(5000, null, null, 1000, 'running', nowMs)).toBe(4000);
        });

        it('should return max 0 for negative values', () => {
            expect(computeElapsedMs(10000, null, null, 6000, 'running', nowMs)).toBe(0);
        });
    });

    describe('isSessionComplete', () => {
        const words = ['hello', 'world', 'test'];

        it('should return false for null config', () => {
            expect(isSessionComplete(null, 0, words, 0)).toBe(false);
        });

        it('should return false for null words', () => {
            expect(isSessionComplete({ mode: 'words' }, 0, null, 0)).toBe(false);
        });

        describe('time mode', () => {
            it('should return false before time expires', () => {
                expect(isSessionComplete({ mode: 'time', durationSeconds: 60 }, 0, words, 50000)).toBe(false);
            });

            it('should return true when time expires', () => {
                expect(isSessionComplete({ mode: 'time', durationSeconds: 60 }, 0, words, 60000)).toBe(true);
            });

            it('should return true after time expires', () => {
                expect(isSessionComplete({ mode: 'time', durationSeconds: 60 }, 0, words, 70000)).toBe(true);
            });

            it('should default to 60 seconds', () => {
                expect(isSessionComplete({ mode: 'time' }, 0, words, 60000)).toBe(true);
            });
        });

        describe('words mode', () => {
            it('should return false when not all words typed', () => {
                expect(isSessionComplete({ mode: 'words' }, 1, words, 1000)).toBe(false);
            });

            it('should return true when all words typed', () => {
                expect(isSessionComplete({ mode: 'words' }, 3, words, 1000)).toBe(true);
            });

            it('should return true when beyond words length', () => {
                expect(isSessionComplete({ mode: 'words' }, 5, words, 1000)).toBe(true);
            });
        });
    });

    describe('commitWord', () => {
        const words = ['hello', 'world'];

        it('should return null when input is empty', () => {
            expect(commitWord('', 0, words, [])).toBeNull();
        });

        it('should return null when word index exceeds words', () => {
            expect(commitWord('hello', 2, words, [])).toBeNull();
        });

        it('should commit word and advance index', () => {
            const result = commitWord('hello', 0, words, []);
            expect(result).toEqual({
                nextHistory: ['hello'],
                nextWordIndex: 1
            });
        });

        it('should accumulate history', () => {
            const result = commitWord('world', 1, words, ['hello']);
            expect(result).toEqual({
                nextHistory: ['hello', 'world'],
                nextWordIndex: 2
            });
        });
    });

    describe('handleBackspace', () => {
        const words = ['hello', 'world'];

        it('should return null when at word index 0', () => {
            expect(handleBackspace(0, ['hello'])).toBeNull();
        });

        it('should return null when history is empty', () => {
            expect(handleBackspace(1, [])).toBeNull();
        });

        it('should restore previous word', () => {
            const result = handleBackspace(1, ['hello']);
            expect(result).toEqual({
                newHistory: [],
                newWordIndex: 0,
                restoredInput: 'hello'
            });
        });

        it('should restore from middle of history', () => {
            const result = handleBackspace(2, ['hello', 'world']);
            expect(result).toEqual({
                newHistory: ['hello'],
                newWordIndex: 1,
                restoredInput: 'world'
            });
        });
    });

    describe('calculatePauseSecond', () => {
        it('should calculate pause second correctly', () => {
            expect(calculatePauseSecond(0, 5000, 0)).toBe(5);
        });

        it('should handle null startedAt', () => {
            expect(calculatePauseSecond(null, 5000, 0)).toBe(0);
        });

        it('should handle pausedDurationMs', () => {
            expect(calculatePauseSecond(0, 6000, 1000)).toBe(5);
        });

        it('should return max 0', () => {
            expect(calculatePauseSecond(10000, 5000, 0)).toBe(0);
        });
    });

    describe('shouldAddPauseMoment', () => {
        it('should return true when pause moment not exists', () => {
            expect(shouldAddPauseMoment([1, 2, 3], 4)).toBe(true);
        });

        it('should return false when pause moment exists', () => {
            expect(shouldAddPauseMoment([1, 2, 3], 2)).toBe(false);
        });

        it('should return true for empty array', () => {
            expect(shouldAddPauseMoment([], 5)).toBe(true);
        });
    });

    describe('computePausedDuration', () => {
        it('should compute paused duration correctly', () => {
            expect(computePausedDuration(0, 1000, 3000)).toBe(2000);
        });

        it('should accumulate with existing duration', () => {
            expect(computePausedDuration(1000, 5000, 7000)).toBe(3000);
        });

        it('should handle null pausedAt', () => {
            expect(computePausedDuration(0, null, 5000)).toBe(0);
        });
    });

    describe('computeTimerDisplay', () => {
        describe('time mode', () => {
            it('should show remaining time', () => {
                expect(computeTimerDisplay({ mode: 'time', durationSeconds: 60 }, 10000)).toBe(50);
            });

            it('should return 0 when time expires', () => {
                expect(computeTimerDisplay({ mode: 'time', durationSeconds: 60 }, 60000)).toBe(0);
            });

            it('should not go negative', () => {
                expect(computeTimerDisplay({ mode: 'time', durationSeconds: 60 }, 70000)).toBe(0);
            });
        });

        describe('words mode', () => {
            it('should show elapsed seconds', () => {
                expect(computeTimerDisplay({ mode: 'words' }, 1500)).toBe(1);
            });

            it('should round down', () => {
                expect(computeTimerDisplay({ mode: 'words' }, 1999)).toBe(1);
            });

            it('should return 0 for negative elapsed', () => {
                expect(computeTimerDisplay({ mode: 'words' }, -100)).toBe(0);
            });
        });

        it('should return 0 for null config', () => {
            expect(computeTimerDisplay(null, 1000)).toBe(0);
        });
    });

    describe('validateTransition', () => {
        it('should allow idle -> running', () => {
            expect(validateTransition('idle', 'running')).toBe(true);
        });

        it('should allow running -> paused', () => {
            expect(validateTransition('running', 'paused')).toBe(true);
        });

        it('should allow running -> complete', () => {
            expect(validateTransition('running', 'complete')).toBe(true);
        });

        it('should allow paused -> running', () => {
            expect(validateTransition('paused', 'running')).toBe(true);
        });

        it('should allow complete -> idle', () => {
            expect(validateTransition('complete', 'idle')).toBe(true);
        });

        it('should not allow idle -> paused', () => {
            expect(validateTransition('idle', 'paused')).toBe(false);
        });

        it('should not allow running -> idle', () => {
            expect(validateTransition('running', 'idle')).toBe(false);
        });

        it('should not allow paused -> complete', () => {
            expect(validateTransition('paused', 'complete')).toBe(false);
        });

        it('should not allow invalid status', () => {
            expect(validateTransition('invalid', 'running')).toBe(false);
        });
    });

    describe('calculateCorrectKeystrokes', () => {
        const currentWord = 'hello';

        it('should return previous correct when no added chars', () => {
            expect(calculateCorrectKeystrokes('', 0, currentWord, '')).toBe(0);
        });

        it('should return previous correct when no current word', () => {
            expect(calculateCorrectKeystrokes('', 0, null, 'h')).toBe(0);
        });

        it('should count correct characters', () => {
            expect(calculateCorrectKeystrokes('h', 0, currentWord, 'h')).toBe(1);
        });

        it('should count multiple correct characters', () => {
            expect(calculateCorrectKeystrokes('he', 0, currentWord, 'he')).toBe(2);
        });

        it('should not count incorrect characters', () => {
            expect(calculateCorrectKeystrokes('x', 0, currentWord, 'x')).toBe(0);
        });

        it('should mix correct and incorrect', () => {
            expect(calculateCorrectKeystrokes('hxllo', 0, currentWord, 'hxllo')).toBe(4);
        });

        it('should accumulate with previous correct', () => {
            expect(calculateCorrectKeystrokes('he', 5, currentWord, 'he')).toBe(7);
        });
    });
});