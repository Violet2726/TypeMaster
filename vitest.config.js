import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/engine/__tests__/**/*.test.js', 'src/hooks/__tests__/**/*.test.jsx', 'src/services/__tests__/**/*.test.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: 'coverage',
            include: ['src/**/*.{js,jsx}'],
            exclude: [
                'node_modules/',
                'dist/',
                'docs/',
                'src/**/*.test.{js,jsx}',
                'src/**/__tests__/'
            ],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 50,
                statements: 60
            }
        }
    }
});
