import { handle } from 'hono/vercel';
import { createApi } from './app';

const app = await createApi();

export default handle(app);
