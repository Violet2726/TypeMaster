import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const stylesRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function escapeSelector(selector) {
    return selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBlock(css, selector) {
    const match = css.match(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`));
    return match?.[1] || '';
}

describe('result page CSS', () => {
    test('keeps the empty result state inside the shared command deck shell', async () => {
        const css = await readFile(resolve(stylesRoot, 'result-page.css'), 'utf8');
        const emptyPanel = getBlock(css, '.result-empty-panel');
        const emptyTitle = getBlock(css, '.result-empty-panel h1');
        const emptyAction = getBlock(css, '.result-empty-panel .app-command-deck__actions .action-btn');

        expect(emptyPanel).toContain('grid-template-columns: minmax(0, 0.72fr) minmax(18rem, 0.5fr);');
        expect(emptyPanel).toContain('align-items: stretch;');
        expect(emptyTitle).toContain('max-width: 12ch;');
        expect(emptyAction).toContain('min-width: 8.8rem;');
    });

    test('keeps the completion stage clear instead of decorative and score-heavy', async () => {
        const css = await readFile(resolve(stylesRoot, 'result-page.css'), 'utf8');
        const completionStage = getBlock(css, '.result-completion-stage');
        const summaryHero = getBlock(css, '.result-summary-hero');
        const summaryScores = getBlock(css, '.result-summary-hero .result-summary__scores');

        expect(css).not.toMatch(/\.result-completion-stage::before[\s\S]*radial-gradient/);
        expect(completionStage).toContain('grid-template-columns: minmax(0, 1.18fr) minmax(20rem, 0.72fr);');
        expect(completionStage).toContain('border-radius: 28px;');
        expect(completionStage).toContain('backdrop-filter: blur(20px) saturate(140%);');
        expect(summaryHero).toContain('grid-template-columns: minmax(0, 1fr) minmax(10.5rem, 0.42fr);');
        expect(summaryScores).toContain('grid-template-columns: 1fr;');
    });

    test('keeps the replay chart quiet and focused on the primary trend', async () => {
        const css = await readFile(resolve(stylesRoot, 'result-page.css'), 'utf8');
        const summaryCard = getBlock(css, '.replay-summary-card');
        const mergedCanvas = getBlock(css, '.replay-canvas--merged');
        const plotBackground = getBlock(css, '.chart-plot-bg');
        const gridLine = getBlock(css, '.replay-grid-line');
        const axisLabel = getBlock(css, '.replay-axis-label');
        const mainArea = getBlock(css, '.replay-main-area');
        const mainLine = getBlock(css, '.replay-main-line');
        const secondaryLine = getBlock(css, '.replay-secondary-line');
        const burstBar = getBlock(css, '.replay-burst-bar');

        expect(summaryCard).toContain('background: transparent;');
        expect(summaryCard).toContain('border-color: transparent;');
        expect(summaryCard).toContain('box-shadow: none;');
        expect(mergedCanvas).toContain('padding: 0;');
        expect(mergedCanvas).toContain('background: transparent;');
        expect(plotBackground).toContain('fill: transparent;');
        expect(gridLine).toContain('stroke-opacity: 0.42;');
        expect(axisLabel).toContain('font-size: 11px;');
        expect(mainArea).toContain('fill: url(#mergedReplayAreaGradient);');
        expect(mainLine).toContain('stroke-width: 3.6;');
        expect(secondaryLine).toContain('stroke-width: 1.6;');
        expect(secondaryLine).toContain('stroke-dasharray: none;');
        expect(burstBar).toContain('stroke: rgba(255, 159, 10, 0.2);');
        expect(burstBar).toContain('stroke-width: 5;');
    });

    test('keeps the result decision actions primary-first and low-noise', async () => {
        const css = await readFile(resolve(stylesRoot, 'result-page.css'), 'utf8');
        const signal = getBlock(css, '.result-completion-stage__decision .result-decision-signal');
        const actions = getBlock(css, '.result-completion-stage__decision .result-decision-actions');
        const primaryAction = getBlock(css, '.result-completion-stage__decision .result-decision-primary-action');
        const secondaryActions = getBlock(css, '.result-completion-stage__decision .result-decision-secondary-actions');
        const secondaryAction = getBlock(css, '.result-completion-stage__decision .result-decision-secondary-action');

        expect(signal).toContain('border: 0;');
        expect(signal).toContain('background: transparent;');
        expect(actions).toContain('display: grid;');
        expect(primaryAction).toContain('width: 100%;');
        expect(primaryAction).toContain('min-height: 3.08rem;');
        expect(secondaryActions).toContain('justify-content: center;');
        expect(secondaryAction).toContain('border-color: transparent;');
        expect(secondaryAction).toContain('background: transparent;');
        expect(secondaryAction).toContain('box-shadow: none;');
        expect(css).not.toMatch(/\.result-completion-stage__decision \.results-actions\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    });

    test('keeps the result advice panel explanatory instead of action-heavy', async () => {
        const css = await readFile(resolve(stylesRoot, 'result-page.css'), 'utf8');
        const advicePanel = getBlock(css, '.result-advice-panel');
        const adviceHead = getBlock(css, '.result-advice-panel .panel-head');

        expect(advicePanel).toContain('border: 0;');
        expect(advicePanel).toContain('border-top: 1px solid var(--tm-white-alpha-100);');
        expect(advicePanel).toContain('background: transparent;');
        expect(advicePanel).toContain('box-shadow: none;');
        expect(advicePanel).toContain('padding: 1rem 0 0;');
        expect(adviceHead).toContain('align-items: baseline;');
        expect(css).not.toContain('.result-advice-panel .results-actions');
    });
});
