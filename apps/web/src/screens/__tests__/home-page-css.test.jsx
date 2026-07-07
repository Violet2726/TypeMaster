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
    test('keeps home actions as a compact list instead of cards', async () => {
        const css = await readFile(resolve(screenDir, 'home-page.css'), 'utf8');
        const actionList = getBlock(css, '.home-action-list');
        const actionRow = getBlock(css, '.home-action-row');

        expect(actionList).toContain('display: grid;');
        expect(actionList).toContain('border-radius: 24px;');
        expect(actionList).toContain('backdrop-filter: blur(16px) saturate(135%);');
        expect(actionRow).toContain('grid-template-columns: auto minmax(0, 1fr) auto;');
        expect(actionRow).toContain('min-height: 4.2rem;');
    });

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
