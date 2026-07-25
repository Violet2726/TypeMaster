import { describe, expect, it } from 'vitest';
import { translate } from './index';

describe('TypeRift bilingual messages', () => {
    it('returns Chinese and English copy from the same key', () => {
        expect(translate('zh-CN', 'hub.title')).toContain('节奏');
        expect(translate('en-US', 'hub.title')).toBe('Turn rhythm into force.');
    });
    it('falls back to a stable message key', () => {
        expect(translate('en-US', 'unknown.message')).toBe('unknown.message');
    });
});
