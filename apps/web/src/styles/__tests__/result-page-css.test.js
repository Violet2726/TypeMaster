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
    test('keeps the completion stage clear instead of decorative and score-heavy', async () => {
        const css = await readFile(resolve(stylesRoot, 'result-page.css'), 'utf8');
        const completionStage = getBlock(css, '.result-completion-stage');
        const summaryHero = getBlock(css, '.result-summary-hero');
        const summaryScores = getBlock(css, '.result-summary-hero .result-summary__scores');

        expect(css).not.toMatch(/\.result-completion-stage::before[\s\S]*radial-gradient/);
        expect(completionStage).toContain('grid-template-columns: minmax(0, 1.18fr) minmax(20rem, 0.72fr);');
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
});
