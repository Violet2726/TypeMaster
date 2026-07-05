import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const componentRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stylesRoot = resolve(componentRoot, '../../../styles');

function escapeSelector(selector) {
    return selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBlock(css, selector) {
    const match = css.match(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`));
    return match?.[1] || '';
}

describe('typing area CSS', () => {
    test('keeps locked recovery actions clickable inside the disabled typing shell', async () => {
        const typingExperienceCss = await readFile(resolve(stylesRoot, 'typing-experience.css'), 'utf8');
        const typingAreaCss = await readFile(resolve(componentRoot, 'typing-area.css'), 'utf8');
        const lockedShell = getBlock(typingExperienceCss, '.words-shell.is-locked');
        const lockedActions = getBlock(typingAreaCss, '.words-shell.is-locked .typing-empty-state__actions');

        expect(lockedShell).toContain('pointer-events: none;');
        expect(lockedActions).toContain('pointer-events: auto;');
    });
});
