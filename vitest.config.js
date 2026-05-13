import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/engine/__tests__/**/*.test.js', 'src/hooks/__tests__/**/*.test.jsx', 'src/services/__tests__/**/*.test.js']
    }
});
