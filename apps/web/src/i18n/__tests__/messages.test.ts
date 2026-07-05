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
});
