import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function escapeSelector(selector) {
    return selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBlock(css, selector) {
    const match = css.match(new RegExp(`${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`));
    return match?.[1] || '';
}

function getMediaBlock(css, marker) {
    const start = css.indexOf(marker);
    return start === -1 ? '' : css.slice(start);
}

function getStandaloneBlock(css, selector) {
    const match = css.match(new RegExp(`^\\s*${escapeSelector(selector)}\\s*\\{([\\s\\S]*?)\\}`, 'm'));
    return match?.[1] || '';
}

describe('app primitives CSS', () => {
    test('keeps the mobile home command surface readable and glanceable', async () => {
        const css = await readFile(resolve(appRoot, 'src/components/app/app-primitives.css'), 'utf8');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const featureCard = getBlock(mobileCss, '.app-feature-card');
        const primaryFeatureCard = getBlock(mobileCss, '.app-feature-card--primary');
        const progressStrip = getBlock(mobileCss, '.home-status-page-stack .app-progress-strip');
        const metricCard = getBlock(mobileCss, '.home-status-page-stack .app-metric-card');

        expect(featureCard).toContain('grid-template-columns: 1fr;');
        expect(featureCard).toContain('box-shadow: none;');
        expect(primaryFeatureCard).toContain('rgba(28, 28, 30, 0.92)');
        expect(primaryFeatureCard).toContain('border-color: rgba(255, 255, 255, 0.14);');
        expect(progressStrip).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));');
        expect(metricCard).toContain('min-height: 3.75rem;');
        expect(metricCard).toContain('background: rgba(118, 118, 128, 0.14);');
    });

    test('keeps the in-game top bar as a lightweight grouped toolbar', async () => {
        const css = await readFile(resolve(appRoot, 'src/styles/design-system.css'), 'utf8');
        const topbar = getStandaloneBlock(css, '.tm-game-topbar');
        const actionGroupBlocks = Array.from(css.matchAll(/^\.tm-game-topbar__actions\s*\{([\s\S]*?)\}/gm), (match) => match[1]);
        const actionGroup = actionGroupBlocks.find((block) => block.includes('display: inline-grid;')) || '';
        const actionButton = getStandaloneBlock(css, '.tm-game-topbar__action');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const mobileAction = getStandaloneBlock(mobileCss, '.tm-game-topbar__action');

        expect(topbar).toContain('top: auto;');
        expect(topbar).toContain('bottom: max(10px, calc(env(safe-area-inset-bottom) + 10px));');
        expect(actionGroup).toContain('display: inline-grid;');
        expect(actionGroup).toContain('grid-auto-flow: column;');
        expect(actionGroup).toContain('padding: 0.18rem;');
        expect(actionButton).toContain('min-width: var(--tm-touch-target);');
        expect(actionButton).toContain('min-height: var(--tm-touch-target);');
        expect(actionButton).toContain('border: 0;');
        expect(mobileAction).toContain('width: var(--tm-touch-target);');
    });

    test('keeps the shared command deck as a floating two-column shell that stacks on mobile', async () => {
        const css = await readFile(resolve(appRoot, 'src/components/app/app-primitives.css'), 'utf8');
        const deck = getBlock(css, '.app-command-deck');
        const withAside = getBlock(css, '.app-command-deck--with-aside');
        const mobileCss = getMediaBlock(css, '@media (max-width: 720px)');
        const mobileDeck = getBlock(mobileCss, '.app-command-deck,\n    .app-command-deck--with-aside');

        expect(deck).toContain('border-radius: 28px;');
        expect(deck).toContain('backdrop-filter: blur(20px) saturate(145%);');
        expect(withAside).toContain('grid-template-columns: minmax(0, 1.05fr) minmax(17rem, 0.95fr);');
        expect(mobileDeck).toContain('grid-template-columns: 1fr;');
        expect(mobileDeck).toContain('border-radius: 24px;');
    });
});
