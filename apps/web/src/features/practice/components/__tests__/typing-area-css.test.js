import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const componentRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stylesRoot = resolve(componentRoot, '../../../styles');
const screensRoot = resolve(componentRoot, '../../../screens');

function escapeSelector(selector) {
    return selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBlock(css, selector) {
    const match = css.match(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`));
    return match?.[1] || '';
}

function getMediaBlock(css, startMarker, endMarker) {
    const start = css.indexOf(startMarker);

    if (start === -1) {
        return '';
    }

    const end = endMarker ? css.indexOf(endMarker, start + startMarker.length) : -1;

    return css.slice(start, end === -1 ? undefined : end);
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

    test('keeps mobile live stats compact above the bottom navigation', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const practicePageCss = await readFile(resolve(screensRoot, 'practice-page.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const mobilePracticeCss = getMediaBlock(practicePageCss, '@media (max-width: 720px)');
        const mobileLiveStats = getBlock(mobileWorkshopCss, '.typing-stage .live-stats');
        const mobileLiveStat = getBlock(mobileWorkshopCss, '.typing-stage .live-stat');
        const mobileWordsContainer = getBlock(
            mobilePracticeCss,
            '.practice-page--refined .practice-workbench__primary .typing-stage .words-container'
        );

        expect(mobileLiveStats).toContain('padding: 0.22rem;');
        expect(mobileLiveStat).toContain('min-height: 3.05rem;');
        expect(mobileLiveStat).not.toContain('4.15rem');
        expect(mobileWordsContainer).toContain('2.65');
    });

    test('keeps custom compose source controls as a mobile summary', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const composeSourceBody = getBlock(
            mobileWorkshopCss,
            '.config-strip--compose .config-setting-row--source .config-setting-row__body'
        );

        expect(composeSourceBody).toContain('display: none;');
    });

    test('keeps custom compose training settings light on mobile', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const composeSourceRow = getBlock(mobileWorkshopCss, '.config-strip--compose .config-setting-row--source');
        const composeModeRow = getBlock(mobileWorkshopCss, '.config-strip--compose .config-setting-row--mode');
        const composePrimaryList = getBlock(mobileWorkshopCss, '.config-strip--compose .config-settings-list--primary');
        const composeSettingRow = getBlock(mobileWorkshopCss, '.config-strip--compose .config-setting-row');
        const composeActionButton = getBlock(mobileWorkshopCss, '.config-strip--compose .config-strip__actions .ghost-btn');

        expect(composeSourceRow).toContain('display: none;');
        expect(composeModeRow).toContain('border-top: 0;');
        expect(composePrimaryList).toContain('border-radius: var(--radius-md);');
        expect(composePrimaryList).toContain('background: rgba(118, 118, 128, 0.1);');
        expect(composeSettingRow).toContain('padding: 0.52rem;');
        expect(composeActionButton).toContain('min-height: 2.24rem;');
        expect(composeActionButton).toContain('background: rgba(118, 118, 128, 0.1);');
    });

    test('keeps the custom text mobile footer as a light toolbar', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const footer = getBlock(mobileWorkshopCss, '.custom-text-workshop__footer');
        const metrics = getBlock(mobileWorkshopCss, '.custom-text-workshop__metrics');
        const metricItem = getBlock(mobileWorkshopCss, '.custom-text-workshop__metrics span');
        const footerButton = getBlock(mobileWorkshopCss, '.custom-text-workshop__footer .action-btn');

        expect(footer).toContain('grid-template-columns: minmax(0, 1fr) auto;');
        expect(footer).toContain('border-radius: var(--radius-pill);');
        expect(metrics).toContain('flex-wrap: nowrap;');
        expect(metricItem).toContain('min-height: 2.35rem;');
        expect(footerButton).toContain('width: auto;');
        expect(footerButton).not.toContain('width: 100%;');
    });

    test('keeps the custom text mobile editor as a light input tray', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const editor = getBlock(mobileWorkshopCss, '.custom-text-workshop__editor');
        const textarea = getBlock(mobileWorkshopCss, '.custom-text-workshop__editor textarea');
        const focusedTextarea = getBlock(mobileWorkshopCss, '.custom-text-workshop__editor textarea:focus-visible');

        expect(editor).toContain('padding: 0.42rem;');
        expect(editor).toContain('background: rgba(118, 118, 128, 0.1);');
        expect(textarea).toContain('min-height: 8.4rem;');
        expect(textarea).toContain('border-color: transparent;');
        expect(textarea).toContain('background: rgba(255, 255, 255, 0.045);');
        expect(focusedTextarea).toContain('border-color: var(--accent-blue-border);');
        expect(focusedTextarea).toContain('box-shadow: 0 0 0 3px var(--accent-blue-bg);');
    });
});
