import { createNodeVitestConfig } from '@typerift/config/vitest';

export default createNodeVitestConfig({
    include: ['src/**/*.test.ts'],
    coverageInclude: ['src/**/*.ts']
});
