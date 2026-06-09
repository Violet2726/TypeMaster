import { createNodeVitestConfig } from '@typemaster/config/vitest';

export default createNodeVitestConfig({
    include: ['src/__tests__/**/*.test.js'],
    coverageInclude: ['src/**/*.js']
});
