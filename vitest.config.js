import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['src/test/setup.js'],
        include: [
            'src/engine/__tests__/**/*.test.js',
            'src/hooks/__tests__/**/*.test.jsx',
            'src/services/__tests__/**/*.test.js',
            'src/training/__tests__/**/*.test.js',
            'src/components/__tests__/**/*.test.jsx',
            'src/pages/__tests__/**/*.test.jsx'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'html'],
            include: ['src/engine/**/*.js', 'src/hooks/**/*.jsx', 'src/services/**/*.js'],
            thresholds: {
                lines: 70,
                functions: 70,
                statements: 70,
                branches: 50
            }
        }
    }
});
