import { serve } from '@hono/node-server';
import app from './app';

const PORT = 8080;
serve({
    fetch: app.fetch,
    port: PORT
});

console.log(`Server running at http://localhost:${PORT}/`);
console.log(`AI practice endpoint: http://localhost:${PORT}/api/practice-text`);
console.log(`AI coach endpoint: http://localhost:${PORT}/api/coach`);
