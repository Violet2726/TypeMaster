import { createNodeVitestConfig } from '@typemaster/config/vitest';

export default createNodeVitestConfig({
    include: ['src/**/*.test.jsx'],
    coverageInclude: ['src/**/*.jsx']
});
