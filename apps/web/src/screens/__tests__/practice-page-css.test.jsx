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

    test('keeps custom compose layout weighted toward the editor', async () => {
        const css = await readFile(cssPath, 'utf8');
        const composeWorkbenchRule = getRuleBody(css, '.practice-page--refined.practice-page--compose .practice-workbench');

        expect(composeWorkbenchRule).toContain('minmax(0, 1.18fr)');
        expect(composeWorkbenchRule).toContain('minmax(18rem, 0.82fr)');
    });

    test('keeps the custom compose typing preview compact on mobile', async () => {
        const css = await readFile(cssPath, 'utf8');
        const previewStageRule = getRuleBody(css, '.practice-page--compose .practice-toolbar__studio--typing-preview .typing-stage');
        const previewBodyRule = getRuleBody(css, '.practice-page--compose .practice-toolbar__studio--typing-preview .words-shell');
        const previewFooterRule = getRuleBody(css, '.practice-page--compose .practice-toolbar__studio--typing-preview .typing-stage__footer');

        expect(css).toContain('@media (max-width: 720px)');
        expect(previewStageRule).toContain('min-height: 0;');
        expect(previewBodyRule).toContain('display: none;');
        expect(previewFooterRule).toContain('display: none;');
    });
});
