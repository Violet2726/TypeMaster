import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

async function readOptionalFile(path) {
    try {
        return await readFile(path, 'utf8');
    } catch (error) {
        if (error?.code === 'ENOENT') return '';
        throw error;
    }
}

describe('global CSS boundary', () => {
    test('keeps the root layout on modular style entries instead of the legacy global bundle', async () => {
        const rootLayout = await readFile(resolve(appRoot, 'app/layout.tsx'), 'utf8');
        const legacyGlobalCss = await readOptionalFile(resolve(appRoot, 'index.css'));

        expect(rootLayout).not.toMatch(/import\s+['"]\.\.\/index\.css['"]/);
        expect(legacyGlobalCss).not.toMatch(/\.(app-header|panel|practice-page|result-summary|settings-drawer)\b/);
    });
});
