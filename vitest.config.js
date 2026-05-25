import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/engine/__tests__/**/*.test.js', 'src/hooks/__tests__/**/*.test.jsx', 'src/services/__tests__/**/*.test.js'],
        coverage: {
            reporter: ['text-summary', 'html'],
            reportsDirectory: './coverage',
            include: ['src/**/*.js', 'src/**/*.jsx'],
            exclude: [
                'src/**/__tests__/**',
                'src/**/node_modules/**',
                'src/main.jsx'
            ],
            thresholds: {
                statements: 20,
                branches: 70,
                functions: 65,
                lines: 20
            }
        }
    }
});
