import eslint from '@eslint/js';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';
import next from '@next/eslint-plugin-next';

export default typescript.config(
    { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/coverage/**', '**/drizzle/meta/**', 'apps/web/public/**', '**/next-env.d.ts'] },
    eslint.configs.recommended,
    ...typescript.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        plugins: { 'react-hooks': hooks },
        rules: {
            ...hooks.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': 'off'
        }
    },
    {
        files: ['apps/web/**/*.{ts,tsx}'],
        plugins: { '@next/next': next },
        rules: {
            ...next.configs.recommended.rules,
            ...next.configs['core-web-vitals'].rules,
            '@next/next/no-html-link-for-pages': 'off'
        }
    },
    {
        files: ['**/*.{js,mjs}'],
        languageOptions: { globals: { ...globals.node } }
    }
);
