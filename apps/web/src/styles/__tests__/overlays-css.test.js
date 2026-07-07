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

describe('overlays CSS', () => {
    test('keeps modal overlays fixed to the viewport and centered', async () => {
        const css = await readFile(resolve(stylesRoot, 'overlays.css'), 'utf8');
        const overlay = getBlock(css, '.settings-overlay,\n.modal-overlay');

        expect(overlay).toContain('position: fixed;');
        expect(overlay).toContain('inset: 0;');
        expect(overlay).toContain('z-index: 80;');
        expect(overlay).toContain('backdrop-filter: saturate(160%) blur(18px);');
        expect(css).toContain('.modal-overlay {\n    display: grid;');
        expect(css).toContain('place-items: center;');
    });
});
