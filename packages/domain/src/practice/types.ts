export type PracticePhase = 'ready' | 'running' | 'paused' | 'complete';

export type PracticeCommand =
    { type: 'type'; text: string } | { type: 'backspace' } | { type: 'tick'; deltaMs: number } | { type: 'pause' } | { type: 'resume' };

export type PracticeEvent =
    | { type: 'started' }
    | { type: 'correct-character'; character: string }
    | { type: 'mistake'; expected: string; entered: string }
    | { type: 'passage-completed'; passageId: string }
    | { type: 'paused' }
    | { type: 'resumed' }
    | { type: 'completed' };

export type PracticeState = {
    seed: string;
    phase: PracticePhase;
    durationMs: number;
    elapsedMs: number;
    passageId: string;
    typed: string;
    attemptedChars: number;
    correctChars: number;
    errors: number;
    currentStreak: number;
    maxStreak: number;
    completedPassages: number;
    mistakesByKey: Record<string, number>;
};

export type PracticeUpdate = {
    state: PracticeState;
    events: PracticeEvent[];
};

export type RunResult = {
    durationMs: number;
    elapsedMs: number;
    wpm: number;
    accuracy: number;
    typedChars: number;
    correctChars: number;
    errors: number;
    maxStreak: number;
    completedPassages: number;
    weakKeys: Array<{ key: string; mistakes: number }>;
};
