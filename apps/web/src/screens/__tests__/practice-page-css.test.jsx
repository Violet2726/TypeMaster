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

function getMediaBlock(css, startMarker) {
    const start = css.indexOf(startMarker);

    return start === -1 ? '' : css.slice(start);
}

describe('practice page CSS', () => {
    test('keeps the practice context attached to the shared command deck shell', async () => {
        const css = await readFile(cssPath, 'utf8');
        const contextRule = getRuleBody(css, '.practice-context');
        const summaryItemRule = getRuleBody(css, '.practice-context__summary-item');

        expect(css).not.toContain('.practice-hero');
        expect(contextRule).toContain('margin-bottom: 0.04rem;');
        expect(summaryItemRule).toContain('border-radius: 18px;');
        expect(summaryItemRule).toContain('background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025));');
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

    test('keeps the custom compose typing preview visually light on mobile', async () => {
        const css = await readFile(cssPath, 'utf8');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const previewStageRule = getRuleBody(mobileCss, '.practice-page--compose .practice-toolbar__studio--typing-preview .typing-stage');
        const previewOverlayRule = getRuleBody(mobileCss, '.practice-page--compose .practice-toolbar__studio--typing-preview .typing-stage::after');
        const previewSummaryRule = getRuleBody(mobileCss, '.practice-page--compose .practice-toolbar__studio--typing-preview .typing-stage__summary');
        const previewStatusRule = getRuleBody(mobileCss, '.practice-page--compose .practice-toolbar__studio--typing-preview .typing-stage__status');
        const previewBadgeRule = getRuleBody(mobileCss, '.practice-page--compose .practice-toolbar__studio--typing-preview .typing-stage__status .panel-badge');

        expect(previewStageRule).toContain('padding: 0.72rem;');
        expect(previewStageRule).toContain('background: rgba(118, 118, 128, 0.1);');
        expect(previewStageRule).toContain('box-shadow: none;');
        expect(previewOverlayRule).toContain('display: none;');
        expect(previewSummaryRule).toContain('gap: 0.48rem;');
        expect(previewStatusRule).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
        expect(previewBadgeRule).toContain('min-height: 2.08rem;');
        expect(previewBadgeRule).toContain('border-radius: var(--radius-pill);');
    });

    test('gives custom compose mobile chrome clear scroll safety', async () => {
        const css = await readFile(cssPath, 'utf8');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const composePageRule = getRuleBody(mobileCss, '.practice-page--refined.practice-page--compose');
        const composeWorkbenchRule = getRuleBody(mobileCss, '.practice-page--compose .practice-workbench');
        const composeRailRule = getRuleBody(mobileCss, '.practice-page--compose .practice-workbench__rail');

        expect(composePageRule).toContain('padding-bottom: calc(2.8rem + env(safe-area-inset-bottom, 0px));');
        expect(composeWorkbenchRule).toContain('scroll-margin-top: 4.35rem;');
        expect(composeRailRule).toContain('scroll-margin-bottom: calc(5.4rem + env(safe-area-inset-bottom, 0px));');
    });

    test('keeps the default mobile settings rail clear of the bottom navigation', async () => {
        const css = await readFile(cssPath, 'utf8');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const pageRule = getRuleBody(mobileCss, '.practice-page--refined');
        const railRule = getRuleBody(mobileCss, '.practice-workbench__rail');

        expect(pageRule).toContain('padding-bottom: calc(5.4rem + env(safe-area-inset-bottom, 0px));');
        expect(railRule).toContain('scroll-margin-bottom: calc(5.4rem + env(safe-area-inset-bottom, 0px));');
    });

    test('keeps the default mobile settings rail title as a compact header', async () => {
        const css = await readFile(cssPath, 'utf8');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const inspectorHeadRule = getRuleBody(mobileCss, '.practice-workbench__rail .practice-toolbar .tm-inspector__head');
        const inspectorKickerRule = getRuleBody(mobileCss, '.practice-workbench__rail .practice-toolbar .tm-inspector__head p');
        const inspectorTitleRule = getRuleBody(mobileCss, '.practice-workbench__rail .practice-toolbar .tm-inspector__head h2');
        const inspectorBadgeRule = getRuleBody(mobileCss, '.practice-workbench__rail .practice-toolbar .tm-inspector__badge');

        expect(inspectorHeadRule).toContain('align-items: center;');
        expect(inspectorHeadRule).toContain('gap: 0.52rem;');
        expect(inspectorKickerRule).toContain('display: none;');
        expect(inspectorTitleRule).toContain('font-size: 1.08rem;');
        expect(inspectorTitleRule).toContain('line-height: 1.12;');
        expect(inspectorBadgeRule).toContain('border-color: transparent;');
        expect(inspectorBadgeRule).toContain('background: rgba(118, 118, 128, 0.08);');
    });

    test('keeps the mobile practice context focused on title first', async () => {
        const css = await readFile(cssPath, 'utf8');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const contextRule = getRuleBody(mobileCss, '.practice-context');
        const asideRule = getRuleBody(mobileCss, '.practice-context__aside');
        const titleRule = getRuleBody(mobileCss, '.practice-context h1,\n    .practice-context .app-command-deck h1');
        const bodyRule = getRuleBody(mobileCss, '.practice-context .hero-body');

        expect(contextRule).toContain('margin-bottom: 0;');
        expect(asideRule).toContain('display: none;');
        expect(titleRule).toContain('font-size: 1.42rem;');
        expect(titleRule).toContain('line-height: 1.08;');
        expect(bodyRule).toContain('display: none;');
    });
});
