import { describe, expect, it } from 'vitest';
import { formatDurationLabel } from '../index';

describe('i18n formatting', () => {
    it('formats short duration labels for the active language', () => {
        expect(formatDurationLabel(30, 'zh-CN')).toBe('30 秒');
        expect(formatDurationLabel(30, 'en-US')).toBe('30s');
    });
});
