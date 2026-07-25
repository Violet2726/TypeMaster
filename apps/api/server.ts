import { serve } from '@hono/node-server';
import { createApi } from './app';

const port = Number(process.env.PORT ?? 8080);
const app = await createApi();

serve({ fetch: app.fetch, port }, ({ port: activePort }) => {
    console.info(JSON.stringify({ level: 'info', service: 'typerift-api', port: activePort }));
});
