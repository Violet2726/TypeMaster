import type { RunResult } from '@typerift/domain';

export type CoachAggregate = Pick<
    RunResult,
    'mode' | 'difficulty' | 'score' | 'accuracy' | 'wpm' | 'maxCombo' | 'durationMs' | 'defeated' | 'bosses' | 'weakChars'
>;

export function buildCoachPolishPayload(result: CoachAggregate, locale: 'zh-CN' | 'en-US') {
    return {
        locale,
        metrics: {
            mode: result.mode,
            difficulty: result.difficulty,
            score: result.score,
            accuracy: result.accuracy,
            wpm: result.wpm,
            maxCombo: result.maxCombo,
            durationMs: result.durationMs,
            defeated: result.defeated,
            bosses: result.bosses,
            weakCharacterKeys: result.weakChars.slice(0, 6)
        },
        constraints: {
            noRawInput: true,
            noKeystrokeHistory: true,
            maxSentences: 4
        }
    } as const;
}

export function buildLocalCoachKeys(result: CoachAggregate) {
    return {
        summaryKey: result.accuracy >= 96 ? 'coach.summary.stable' : 'coach.summary.repair',
        focusKeys: result.weakChars.slice(0, 3).map((character) => `coach.focus.${character}`)
    };
}
