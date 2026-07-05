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
});
