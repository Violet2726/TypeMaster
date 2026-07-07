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

describe('missions page CSS', () => {
    test('keeps the mission header metrics inside a compact aside grid', async () => {
        const css = await readFile(resolve(screenDir, 'missions-page.css'), 'utf8');
        const command = getBlock(css, '.mission-command');
        const statusGrid = getBlock(css, '.mission-command__status-grid');
        const statusItem = getBlock(css, '.mission-status-item');

        expect(command).toContain('margin-bottom: 0.04rem;');
        expect(statusGrid).toContain('display: grid;');
        expect(statusGrid).toContain('gap: 0.62rem;');
        expect(statusItem).toContain('grid-template-columns: auto minmax(0, 1fr);');
        expect(statusItem).toContain('border-radius: 18px;');
    });

    test('keeps mission choices as compact glass rows instead of cards', async () => {
        const css = await readFile(resolve(screenDir, 'missions-page.css'), 'utf8');
        const actionList = getBlock(css, '.mission-action-list');
        const actionRow = getBlock(css, '.mission-action-row');

        expect(actionList).toContain('display: grid;');
        expect(actionList).toContain('border-radius: 24px;');
        expect(actionList).toContain('backdrop-filter: blur(16px) saturate(135%);');
        expect(actionRow).toContain('grid-template-columns: auto minmax(0, 1fr) auto;');
        expect(actionRow).toContain('min-height: 4rem;');
    });
});
