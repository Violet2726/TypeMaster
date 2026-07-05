import { describe, expect, it } from 'vitest';
import { enUSMessages } from '../messages/en-US';
import { zhCNMessages } from '../messages/zh-CN';

function collectKeys(value: unknown, prefix = ''): string[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];

    return Object.entries(value).flatMap(([key, child]) => (
        collectKeys(child, prefix ? `${prefix}.${key}` : key)
    ));
}

describe('i18n messages', () => {
    it('keeps Chinese and English message keys in parity', () => {
        const englishKeys = collectKeys(enUSMessages).sort();
        const chineseKeys = collectKeys(zhCNMessages).sort();

        expect(chineseKeys).toEqual(englishKeys);
    });

    it('keeps Chinese practice first-screen copy localized', () => {
        const firstScreenKeys = [
            'modeTitle',
            'optionsTitle',
            'volumeTitle',
            'wordsLockedTitle',
            'wordsLockedBody',
            'focusLost',
            'pausedTitle',
            'pausedBody',
            'runningHint',
            'idleHint',
            'helperTitle',
            'helperBody',
            'textReadyLabel',
            'textPendingLabel',
            'sessionLabel',
            'timeRemaining',
            'timeElapsed'
        ] as const;

        for (const key of firstScreenKeys) {
            const localizedValue = zhCNMessages.practice[key];

            expect(localizedValue).not.toBe(enUSMessages.practice[key]);
            expect(localizedValue).not.toMatch(/[A-Za-z]{3,}/);
        }
    });

    it('keeps Chinese result review copy localized', () => {
        const resultKeys = [
            'heroKicker',
            'metricsTitle',
            'adviceTitle',
            'challengeStandingTitle',
            'primaryAction',
            'prescriptionTitle',
            'prescriptionFocusLabel',
            'prescriptionDoseLabel',
            'prescriptionCheckpointLabel',
            'prescriptionAccuracyFocus',
            'prescriptionSpeedFocus'
        ] as const;
        const chartKeys = [
            'kicker',
            'title',
            'summaryTitle',
            'avgRaw',
            'peakBurst',
            'dataNote',
            'rawLabel',
            'burstLabel'
        ] as const;
        const trainingResultKeys = [
            'planTitle',
            'decisionBadge',
            'signalLabel',
            'challengePushTitle',
            'challengePlanTitle',
            'challengeFreeTitle'
        ] as const;
        const trainingChallengeKeys = [
            'retryCta',
            'leaderboard',
            'trendFocusTitle',
            'trendPrevDeltaLabel',
            'trendFocusBreakthrough',
            'trendFocusAccuracyRisk'
        ] as const;

        for (const key of resultKeys) {
            expect(zhCNMessages.result[key]).not.toBe(enUSMessages.result[key]);
        }

        for (const key of chartKeys) {
            expect(zhCNMessages.chart[key]).not.toBe(enUSMessages.chart[key]);
        }

        for (const key of trainingResultKeys) {
            expect(zhCNMessages.training.result[key]).not.toBe(enUSMessages.training.result[key]);
        }

        for (const key of trainingChallengeKeys) {
            expect(zhCNMessages.training.challenge[key]).not.toBe(enUSMessages.training.challenge[key]);
        }
    });
});
