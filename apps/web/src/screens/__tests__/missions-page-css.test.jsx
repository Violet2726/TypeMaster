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
    test('keeps the mission header and status row lightweight', async () => {
        const css = await readFile(resolve(screenDir, 'missions-page.css'), 'utf8');
        const command = getBlock(css, '.mission-command');
        const statusRow = getBlock(css, '.mission-status-row');
        const statusItem = getBlock(css, '.mission-status-item');

        expect(command).toContain('display: grid;');
        expect(command).toContain('background: transparent;');
        expect(command).not.toContain('box-shadow');
        expect(statusRow).toContain('display: grid;');
        expect(statusRow).toContain('border-top: 1px solid var(--panel-stroke);');
        expect(statusItem).toContain('grid-template-columns: auto minmax(0, 1fr);');
    });

    test('keeps mission choices as compact rows instead of cards', async () => {
        const css = await readFile(resolve(screenDir, 'missions-page.css'), 'utf8');
        const actionList = getBlock(css, '.mission-action-list');
        const actionRow = getBlock(css, '.mission-action-row');

        expect(actionList).toContain('display: grid;');
        expect(actionList).toContain('background: transparent;');
        expect(actionRow).toContain('grid-template-columns: auto minmax(0, 1fr) auto;');
        expect(actionRow).toContain('min-height: 4rem;');
    });
});
