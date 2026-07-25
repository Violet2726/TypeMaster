import { describe, expect, it } from 'vitest';
import { buildCoachPolishPayload, buildLocalCoachKeys } from './index';

const aggregate = {
    mode: 'expedition' as const,
    difficulty: 'standard' as const,
    score: 1200,
    accuracy: 97,
    wpm: 54,
    maxCombo: 80,
    durationMs: 600_000,
    defeated: 32,
    bosses: 2,
    weakChars: ['q', 'p']
};

describe('privacy-safe coach helpers', () => {
    it('only sends aggregate metrics', () => {
        const payload = buildCoachPolishPayload(aggregate, 'en-US');
        expect(JSON.stringify(payload)).not.toContain('commandLog');
        expect(payload.constraints.noRawInput).toBe(true);
    });
    it('keeps deterministic local coaching available', () => {
        expect(buildLocalCoachKeys(aggregate).summaryKey).toBe('coach.summary.stable');
    });
});
