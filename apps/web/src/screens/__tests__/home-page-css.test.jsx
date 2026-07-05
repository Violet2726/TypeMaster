import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const screenDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function escapeSelector(selector) {
    return selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBlock(css, selector) {
    const match = css.match(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`));
    return match?.[1] || '';
}

describe('home page CSS', () => {
    test('keeps the recent run area as a light status row', async () => {
        const css = await readFile(resolve(screenDir, 'home-page.css'), 'utf8');
        const emptyStatus = getBlock(css, '.home-recent--empty .home-recent-summary__body strong');

        expect(css).not.toContain('.home-recent-list');
        expect(css).not.toContain('.home-recent-item');
        expect(emptyStatus).toContain('display: -webkit-box;');
        expect(emptyStatus).toContain('-webkit-line-clamp: 2;');
        expect(emptyStatus).toContain('white-space: normal;');
    });
});
