import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react'
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'html'],
            include: ['src/i18n/**/*.ts', 'src/lib/api.ts', 'src/store/**/*.ts'],
            thresholds: {
                lines: 80,
                functions: 80,
                statements: 80,
                branches: 70
            }
        }
    }
});
