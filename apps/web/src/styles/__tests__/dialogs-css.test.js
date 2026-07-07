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

describe('dialogs CSS', () => {
    test('keeps confirm dialogs glassy and explicit about action tone', async () => {
        const css = await readFile(resolve(stylesRoot, 'dialogs.css'), 'utf8');
        const dialog = getBlock(css, '.confirm-dialog');
        const bodyTitle = getBlock(css, '.confirm-dialog__body h3');
        const actions = getBlock(css, '.confirm-dialog__actions');
        const defaultTone = getBlock(css, '.confirm-dialog--default .confirm-dialog__btn--confirm');
        const dangerTone = getBlock(css, '.confirm-dialog--danger .confirm-dialog__btn--confirm');

        expect(dialog).toContain('width: min(336px, calc(100vw - 2rem));');
        expect(dialog).toContain('border-radius: 20px;');
        expect(dialog).toContain('backdrop-filter: blur(24px) saturate(140%);');
        expect(dialog).toContain('background:');
        expect(bodyTitle).toContain('font-family: var(--font-display);');
        expect(bodyTitle).toContain('text-wrap: balance;');
        expect(actions).toContain('border-top: 0.5px solid var(--panel-stroke);');
        expect(defaultTone).toContain('color: var(--main-color);');
        expect(dangerTone).toContain('color: var(--error-color);');
    });
});
