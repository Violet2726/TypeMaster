import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const screenDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = resolve(screenDir, '../styles/insights-page-full.css');

function escapeSelector(selector) {
    return selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBlock(css, selector) {
    const match = css.match(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`));
    return match?.[1] || '';
}

function getBlocks(css, selector) {
    return Array.from(
        css.matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`, 'g')),
        (match) => match[1] || ''
    );
}

describe('insights page CSS', () => {
    test('keeps the non-empty insights intro as a shared command deck with a calmer aside stack', async () => {
        const css = await readFile(cssPath, 'utf8');
        const deck = getBlock(css, '.insights-command-deck');
        const deckTitle = getBlock(css, '.insights-command-deck h1');
        const asideGrid = getBlock(css, '.insights-command-deck__aside-grid');
        const commandCard = getBlock(css, '.insights-command-card');
        const metrics = getBlock(css, '.insights-command-card__metrics');

        expect(deck).toContain('margin-bottom: 0.04rem;');
        expect(deckTitle).toContain('font-size: clamp(2.8rem, 5vw, 4.1rem);');
        expect(asideGrid).toContain('display: grid;');
        expect(asideGrid).toContain('gap: 0.72rem;');
        expect(commandCard).toContain('padding: 0.92rem 0.96rem;');
        expect(commandCard).toContain('gap: 0.72rem;');
        expect(metrics).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    });

    test('keeps overview metrics separate from the command deck narrative', async () => {
        const css = await readFile(cssPath, 'utf8');
        const overviewPanel = getBlock(css, '.insights-overview-panel');
        const overviewMetrics = getBlock(css, '.insights-overview-panel__metrics');
        const overviewMetricBlocks = getBlocks(css, '.insights-overview-panel__metric');
        const overviewMetric = overviewMetricBlocks.find((block) => block.includes('min-height: 6.4rem;')) || '';

        expect(overviewPanel).toContain('display: grid;');
        expect(overviewPanel).toContain('padding: 0.82rem;');
        expect(overviewMetrics).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
        expect(overviewMetric).toContain('min-height: 6.4rem;');
        expect(overviewMetric).toContain('padding: 0.8rem 0.84rem;');
    });
});
