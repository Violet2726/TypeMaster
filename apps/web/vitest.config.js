import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react'
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'html'],
            include: ['src/lib/storage.ts'],
            thresholds: {
                lines: 80,
                functions: 80,
                statements: 80,
                branches: 70
            }
        }
    }
});
