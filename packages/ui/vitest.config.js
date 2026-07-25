import { createNodeVitestConfig } from '@typerift/config/vitest';

export default createNodeVitestConfig({
    include: ['src/**/*.test.tsx'],
    coverageInclude: ['src/**/*.tsx'],
    environment: 'jsdom'
});
