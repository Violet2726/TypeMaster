import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../../web/dist');

const MIME_TYPES: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

export function createMissingFrontendBuildResponse() {
    return new Response(
        'Frontend build not found. Run "pnpm dev:web" for development or "pnpm build" before "pnpm dev:api".',
        {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }
    );
}

export async function hasFrontendBuild() {
    try {
        await fs.access(path.join(DIST_DIR, 'index.html'));
        return true;
    } catch {
        return false;
    }
}

export async function serveStaticRequest(requestPath: string) {
    const requestedPath = requestPath === '/' ? '/index.html' : requestPath;
    const resolvedPath = path.resolve(path.join(DIST_DIR, `.${requestedPath}`));

    if (!resolvedPath.startsWith(DIST_DIR)) {
        return new Response('Forbidden', { status: 403 });
    }

    try {
        const content = await fs.readFile(resolvedPath);
        const extname = path.extname(resolvedPath).toLowerCase();

        return new Response(content, {
            status: 200,
            headers: {
                'Content-Type': MIME_TYPES[extname] || 'application/octet-stream',
                'Cache-Control': extname === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
            }
        });
    } catch {
        try {
            const fallback = await fs.readFile(path.join(DIST_DIR, 'index.html'));
            return new Response(fallback, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-cache'
                }
            });
        } catch {
            return new Response('404 Not Found', { status: 404 });
        }
    }
}
