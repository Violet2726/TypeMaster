import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react'
    },
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['src/test/setup.ts'],
        include: [
            'src/application/__tests__/**/*.test.{ts,tsx,js,jsx}',
            'src/features/**/*.test.{ts,tsx,js,jsx}',
            'src/hooks/__tests__/**/*.test.tsx',
            'src/i18n/__tests__/**/*.test.{ts,js}',
            'src/services/__tests__/**/*.test.js',
            'src/store/__tests__/**/*.test.js',
            'src/training/__tests__/**/*.test.js',
            'src/screens/__tests__/**/*.test.jsx'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'html'],
            include: ['src/hooks/**/*.{ts,tsx}', 'src/services/**/*.{ts,js}'],
            thresholds: {
                lines: 70,
                functions: 70,
                statements: 70,
                branches: 50
            }
        }
    }
});
