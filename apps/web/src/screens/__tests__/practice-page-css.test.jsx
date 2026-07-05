import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const screenDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = resolve(screenDir, 'practice-page.css');

function getRuleBody(css, selector) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'm'));

    return match?.[1] ?? '';
}

describe('practice page CSS', () => {
    test('keeps the practice context visually lighter than a panel', async () => {
        const css = await readFile(cssPath, 'utf8');
        const contextRule = getRuleBody(css, '.practice-context');

        expect(css).not.toContain('.practice-hero');
        expect(contextRule).toContain('background: transparent;');
        expect(contextRule).toContain('box-shadow: none;');
    });
});
