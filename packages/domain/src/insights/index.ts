import type { RunResult } from '../game/types';

export type TypingInsight = {
    id: string;
    severity: 'neutral' | 'positive' | 'focus';
    titleKey: string;
    bodyKey: string;
    value: number | string;
};

export function buildDeterministicInsights(result: RunResult): TypingInsight[] {
    const weakest = result.weakChars.slice(0, 3).join(' · ') || '—';
    return [
        {
            id: 'accuracy',
            severity: result.accuracy >= 96 ? 'positive' : 'focus',
            titleKey: 'insight.accuracy.title',
            bodyKey: result.accuracy >= 96 ? 'insight.accuracy.stable' : 'insight.accuracy.repair',
            value: result.accuracy
        },
        {
            id: 'tempo',
            severity: result.wpm >= 45 ? 'positive' : 'neutral',
            titleKey: 'insight.tempo.title',
            bodyKey: result.wpm >= 45 ? 'insight.tempo.fluid' : 'insight.tempo.build',
            value: result.wpm
        },
        {
            id: 'weak-keys',
            severity: result.weakChars.length ? 'focus' : 'positive',
            titleKey: 'insight.weakKeys.title',
            bodyKey: result.weakChars.length ? 'insight.weakKeys.detected' : 'insight.weakKeys.clear',
            value: weakest
        }
    ];
}
