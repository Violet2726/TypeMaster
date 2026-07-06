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

function getStandaloneBlock(css, selector) {
    const match = css.match(new RegExp(`(?:^|\\n)${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`));
    return match?.[1] || '';
}

function getLastBlock(css, selector) {
    const matches = [...css.matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`, 'g'))];
    return matches.at(-1)?.[1] || '';
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

    test('keeps mobile live stats as a light instrument strip', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const practicePageCss = await readFile(resolve(screensRoot, 'practice-page.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const mobilePracticeCss = getMediaBlock(practicePageCss, '@media (max-width: 720px)');
        const mobileFooter = getBlock(mobileWorkshopCss, '.typing-stage__footer');
        const mobileLiveStats = getBlock(mobileWorkshopCss, '.typing-stage .live-stats');
        const mobileLiveStat = getBlock(mobileWorkshopCss, '.typing-stage .live-stats .live-stat');
        const mobileLiveStatTop = getBlock(mobileWorkshopCss, '.typing-stage .live-stat__top');
        const mobileLiveStatIcon = getBlock(mobileWorkshopCss, '.typing-stage .live-stat__icon');
        const mobileLiveStatValue = getBlock(mobileWorkshopCss, '.typing-stage .live-stat-value');
        const mobileLiveStatLabel = getBlock(mobileWorkshopCss, '.typing-stage .live-stat-label');
        const mobileWordsContainer = getBlock(
            mobilePracticeCss,
            '.practice-page--refined .practice-workbench__primary .typing-stage .words-container'
        );

        expect(mobileFooter).toContain('gap: 0.38rem;');
        expect(mobileLiveStats).toContain('padding: 0;');
        expect(mobileLiveStats).toContain('border-color: transparent;');
        expect(mobileLiveStats).toContain('background: transparent;');
        expect(mobileLiveStat).toContain('display: flex;');
        expect(mobileLiveStat).toContain('min-height: 2.28rem;');
        expect(mobileLiveStat).toContain('gap: 0.18rem;');
        expect(mobileLiveStatTop).toContain('display: contents;');
        expect(mobileLiveStatIcon).toContain('width: 0.88rem;');
        expect(mobileLiveStat).not.toContain('4.15rem');
        expect(mobileLiveStatValue).toContain('font-size: 0.98rem;');
        expect(mobileLiveStatValue).toContain('line-height: 1;');
        expect(mobileLiveStatValue).toContain('flex: 0 0 auto;');
        expect(mobileLiveStatLabel).toContain('font-size: 0.58rem;');
        expect(mobileLiveStatLabel).toContain('flex: 0 0 auto;');
        expect(mobileWordsContainer).toContain('2.65');
    });

    test('keeps the mobile typing window overlay light enough for reading', async () => {
        const mobileCss = await readFile(resolve(stylesRoot, 'mobile.css'), 'utf8');
        const typingExperienceCss = await readFile(resolve(stylesRoot, 'typing-experience.css'), 'utf8');
        const mobileWordsBefore = getLastBlock(mobileCss, '.typing-stage .words-shell::before');
        const mobileWordsAfter = getLastBlock(mobileCss, '.typing-stage .words-shell::after');
        const mobileNextWord = getLastBlock(mobileCss, ".typing-stage .word[data-line-state='next']");
        const mobileFutureWord = getLastBlock(mobileCss, ".typing-stage .word[data-line-state='future']");
        const mobilePendingFuture = getLastBlock(mobileCss, '.typing-stage .letter.pending-future');
        const mobileNextPendingFuture = getLastBlock(
            mobileCss,
            ".typing-stage .word[data-line-state='next'] .letter.pending-future"
        );
        const focusOverlay = getStandaloneBlock(typingExperienceCss, '.focus-overlay');

        expect(mobileWordsBefore).toContain('rgba(13, 14, 17, 0.58)');
        expect(mobileWordsBefore).not.toContain('0.94');
        expect(mobileWordsAfter).toContain('rgba(13, 14, 17, 0.62)');
        expect(mobileWordsAfter).not.toContain('0.94');
        expect(mobileNextWord).toContain('color: color-mix(in srgb, var(--text-dim) 82%, transparent);');
        expect(mobileFutureWord).toContain('color: color-mix(in srgb, var(--text-dim) 64%, transparent);');
        expect(mobilePendingFuture).toContain('color: color-mix(in srgb, var(--text-dim) 78%, transparent);');
        expect(mobileNextPendingFuture).toContain('color: color-mix(in srgb, var(--text-dim) 78%, transparent);');
        expect(focusOverlay).toContain('background: rgba(0, 0, 0, 0.24);');
        expect(focusOverlay).toContain('backdrop-filter: blur(8px);');
    });

    test('keeps the mobile typing header as a compact status strip', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const mobileHead = getBlock(mobileWorkshopCss, '.typing-stage__head');
        const mobileSummary = getBlock(mobileWorkshopCss, '.typing-stage__summary');
        const mobileSource = getBlock(mobileWorkshopCss, '.typing-stage__source');
        const mobileSourceLabel = getBlock(mobileWorkshopCss, '.typing-stage__source span');
        const mobileSourceTitle = getBlock(mobileWorkshopCss, '.typing-stage__source strong');
        const mobileStatus = getBlock(mobileWorkshopCss, '.typing-stage__status');
        const mobileSummaryStatus = getBlock(mobileWorkshopCss, '.typing-stage__summary .typing-stage__status');
        const mobileBadge = getBlock(mobileWorkshopCss, '.typing-stage__status .panel-badge');
        const mobileSecondaryBadge = getBlock(mobileWorkshopCss, '.typing-stage__status .panel-badge + .panel-badge');
        const mobileReset = getBlock(mobileWorkshopCss, '.typing-stage__head .ghost-btn');

        expect(mobileHead).toContain('grid-template-columns: minmax(0, 1fr) auto;');
        expect(mobileHead).toContain('align-items: center;');
        expect(mobileHead).toContain('gap: 0.5rem;');
        expect(mobileHead).toContain('padding-bottom: 0.36rem;');
        expect(mobileHead).toContain('border-bottom: 0;');
        expect(mobileSummary).toContain('display: flex;');
        expect(mobileSummary).toContain('align-items: center;');
        expect(mobileSummary).toContain('gap: 0.44rem;');
        expect(mobileSource).toContain('display: flex;');
        expect(mobileSource).toContain('min-width: 0;');
        expect(mobileSourceLabel).toContain('display: none;');
        expect(mobileSourceTitle).toContain('overflow: hidden;');
        expect(mobileSourceTitle).toContain('text-overflow: ellipsis;');
        expect(mobileSourceTitle).toContain('white-space: nowrap;');
        expect(mobileSourceTitle).toContain('font-size: 0.92rem;');
        expect(mobileStatus).toContain('display: flex;');
        expect(mobileStatus).toContain('flex-direction: row;');
        expect(mobileStatus).toContain('flex-wrap: nowrap;');
        expect(mobileStatus).toContain('align-items: center;');
        expect(mobileStatus).toContain('justify-content: flex-end;');
        expect(mobileSummaryStatus).toContain('justify-content: flex-end;');
        expect(mobileBadge).toContain('width: auto;');
        expect(mobileBadge).toContain('flex: 0 0 auto;');
        expect(mobileBadge).toContain('min-height: 1.66rem;');
        expect(mobileSecondaryBadge).toContain('display: none;');
        expect(mobileReset).toContain('width: 2.75rem;');
        expect(mobileReset).toContain('font-size: 0;');
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

    test('keeps default mobile training settings as a lightweight inset summary', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const configStrip = getBlock(mobileWorkshopCss, '.practice-toolbar .config-strip');
        const summaryList = getBlock(mobileWorkshopCss, '.config-summary-list');
        const summaryItem = getBlock(mobileWorkshopCss, '.config-summary-list__item');
        const actions = getBlock(mobileWorkshopCss, '.config-strip__actions');
        const actionButton = getBlock(mobileWorkshopCss, '.config-strip__actions .ghost-btn');

        expect(configStrip).toContain('gap: 0.22rem;');
        expect(summaryList).toContain('border-color: transparent;');
        expect(summaryList).toContain('border-radius: var(--radius-md);');
        expect(summaryList).toContain('background: rgba(118, 118, 128, 0.08);');
        expect(summaryItem).toContain('min-height: 2.28rem;');
        expect(summaryItem).toContain('padding: 0.48rem 0.64rem;');
        expect(actions).toContain('border-top: 1px solid var(--panel-stroke);');
        expect(actionButton).toContain('border-color: transparent;');
        expect(actionButton).toContain('background: transparent;');
    });

    test('keeps expanded mobile training controls as lightweight segmented rows', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const configSettingRow = getBlock(mobileWorkshopCss, '.config-setting-row');
        const configSegmentedGroup = getBlock(mobileWorkshopCss, '.config-strip .segmented-group');
        const sourceSegmentedGroup = getBlock(mobileWorkshopCss, '.config-strip .segmented-group--source');
        const volumeSegmentedGroup = getBlock(mobileWorkshopCss, '.config-strip .segmented-group--volume');
        const configSegmentButton = getBlock(mobileWorkshopCss, '.config-strip .segment-btn');
        const sourceSegmentButton = getBlock(mobileWorkshopCss, '.config-strip .segmented-group--source .segment-btn');
        const volumeSegmentButton = getBlock(mobileWorkshopCss, '.config-strip .segmented-group--volume .segment-btn');
        const activeConfigSegment = getBlock(mobileWorkshopCss, ".config-strip .segment-btn[aria-pressed='true']");

        expect(configSettingRow).toContain('gap: 0.42rem;');
        expect(configSettingRow).toContain('padding: 0.48rem;');
        expect(configSegmentedGroup).toContain('border-color: transparent;');
        expect(configSegmentedGroup).toContain('gap: 0.12rem;');
        expect(configSegmentedGroup).toContain('padding: 0.12rem;');
        expect(configSegmentedGroup).toContain('background: rgba(118, 118, 128, 0.1);');
        expect(sourceSegmentedGroup).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));');
        expect(volumeSegmentedGroup).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
        expect(volumeSegmentedGroup).toContain('gap: 0.08rem;');
        expect(configSegmentButton).toContain('min-height: 1.92rem;');
        expect(configSegmentButton).toContain('padding: 0.36rem 0.46rem;');
        expect(sourceSegmentButton).toContain('justify-content: center;');
        expect(sourceSegmentButton).toContain('padding-inline: 0.34rem;');
        expect(volumeSegmentButton).toContain('padding-inline: 0.26rem;');
        expect(activeConfigSegment).toContain('box-shadow: none;');
    });

    test('keeps advanced mobile options as switch rows', async () => {
        const workshopCss = await readFile(resolve(componentRoot, 'practice-workshop.css'), 'utf8');
        const mobileWorkshopCss = getMediaBlock(workshopCss, '@media (max-width: 720px)', '@media (max-width: 360px)');
        const optionSwitchList = getBlock(workshopCss, '.option-switch-list');
        const optionSwitchRow = getBlock(workshopCss, '.option-switch-row');
        const optionSwitchVisual = getBlock(workshopCss, '.option-switch-row .apple-toggle');
        const mobileOptionSwitchRow = getBlock(mobileWorkshopCss, '.config-strip .option-switch-row');

        expect(optionSwitchList).toContain('display: grid;');
        expect(optionSwitchRow).toContain('justify-content: space-between;');
        expect(optionSwitchRow).toContain('border-radius: var(--radius-md);');
        expect(optionSwitchVisual).toContain('pointer-events: none;');
        expect(mobileOptionSwitchRow).toContain('min-height: 2.58rem;');
        expect(mobileOptionSwitchRow).toContain('padding: 0.42rem 0.54rem;');
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
