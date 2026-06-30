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
});
