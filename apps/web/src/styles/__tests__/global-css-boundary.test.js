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

    test('declares intentional smooth scrolling on the root html element', async () => {
        const rootLayout = await readFile(resolve(appRoot, 'app/layout.tsx'), 'utf8');
        const layoutCss = await readFile(resolve(appRoot, 'src/styles/layout.css'), 'utf8');

        expect(layoutCss).toMatch(/html\s*\{[\s\S]*scroll-behavior:\s*smooth;/);
        expect(rootLayout).toContain('data-scroll-behavior="smooth"');
    });

    test('keeps practice route CSS out of TypingArea component visuals', async () => {
        const practiceRouteCss = await readFile(resolve(appRoot, 'app/practice/practice.css'), 'utf8');
        const practiceWorkshopCss = await readFile(resolve(appRoot, 'src/features/practice/components/practice-workshop.css'), 'utf8');
        const practicePageCss = await readFile(resolve(appRoot, 'src/screens/practice-page.css'), 'utf8');

        expect(practiceRouteCss).not.toMatch(/\b(typing-stage|words-shell|typing-empty-state)\b/);
        expect(practiceWorkshopCss).toMatch(/\.typing-stage\s*\{/);
        expect(practiceWorkshopCss).toMatch(/\.typing-stage::after\s*\{/);
        expect(practicePageCss).toMatch(/\.practice-page--refined \.practice-workbench__primary \.typing-stage\s*\{/);
    });
});
