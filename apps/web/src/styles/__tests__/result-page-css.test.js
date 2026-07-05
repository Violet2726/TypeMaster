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
});
