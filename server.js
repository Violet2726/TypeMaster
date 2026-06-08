/**
 * 本地 Node 服务。
 *
 * 主要职责：
 * 1. 代理 `/api/chat`，隐藏真正的 AI Key。
 * 2. 在构建后模式下托管 `dist/` 静态资源。
 * 3. 在没有构建产物时给出清晰的开发提示。
 *
 * 这份文件不依赖任何第三方后端框架，方便在简单环境中直接启动。
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const {
    getDailyChallenge,
    getUser,
    normalizeUser,
    submitChallengeResult,
    updateUser
} = require('./cloud-store');

/**
 * 优先读取环境变量，随后尝试读取本地 config.js。
 * 这样既兼容本地开发，也兼容云端平台的环境变量注入。
 */
let AI_API_KEY = process.env.AI_API_KEY;
let AI_API_URL = process.env.AI_API_URL;

try {
    const config = require('./config');
    if (config.AI_API_KEY) AI_API_KEY = config.AI_API_KEY;
    if (config.AI_API_URL) AI_API_URL = config.AI_API_URL;
} catch (error) {
    console.log('Config file not found, using environment variables');
}

const PORT = 8080;
const DIST_DIR = path.join(__dirname, 'dist');
const DIST_READY = fs.existsSync(path.join(DIST_DIR, 'index.html'));

/**
 * 静态资源的 MIME 映射。
 */
const MIME_TYPES = {
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

/**
 * 根据目标 URL 的协议选择 http 或 https。
 */
function getTransport(targetUrl) {
    return targetUrl.protocol === 'http:' ? http : https;
}

/**
 * 对前端传来的请求体做白名单收敛。
 * 这样可以限制前端只能透传安全字段，避免把任意参数直接打给上游。
 */
function buildProxyPayload(payload) {
    const body = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const safePayload = {
        model: typeof body.model === 'string' ? body.model : 'glm-4-flash',
        messages: Array.isArray(body.messages) ? body.messages : [],
        stream: body.stream !== false,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 4096,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.8
    };

    if (body.response_format && typeof body.response_format === 'object') {
        safePayload.response_format = body.response_format;
    }

    return safePayload;
}

/**
 * 代理 AI 请求。
 * 服务端只负责鉴权、透传和错误处理，不参与业务 prompt 拼装。
 */
function handleApiProxy(clientReq, clientRes) {
    if (!AI_API_KEY || !AI_API_URL) {
        clientRes.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        clientRes.end('Missing AI_API_KEY or AI_API_URL');
        return;
    }

    let body = '';
    clientReq.on('data', (chunk) => {
        body += chunk.toString();
    });

    clientReq.on('end', () => {
        let proxyPayload;
        try {
            proxyPayload = buildProxyPayload(body);
        } catch (error) {
            clientRes.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            clientRes.end('Invalid JSON');
            return;
        }

        const targetUrl = new URL(AI_API_URL);
        const transport = getTransport(targetUrl);
        const serializedBody = JSON.stringify(proxyPayload);

        const proxyReq = transport.request(
            {
                hostname: targetUrl.hostname,
                port: targetUrl.port || undefined,
                path: `${targetUrl.pathname}${targetUrl.search}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(serializedBody),
                    'Authorization': `Bearer ${AI_API_KEY}`
                }
            },
            (proxyRes) => {
                clientRes.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
                proxyRes.pipe(clientRes);
            }
        );

        proxyReq.on('error', (error) => {
            console.error('API Request Error:', error);
            clientRes.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            clientRes.end('Internal Server Error');
        });

        proxyReq.write(serializedBody);
        proxyReq.end();
    });
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8'
    });
    res.end(JSON.stringify(payload));
}

async function handleCloudApi(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = requestUrl.pathname;
    const userId = req.headers['x-typemaster-user'];

    if (pathname === '/api/cloud/auth/current' && req.method === 'GET') {
        sendJson(res, 200, { user: getUser(userId) });
        return;
    }

    if (pathname === '/api/cloud/auth/sign-in' && req.method === 'POST') {
        try {
            const body = JSON.parse(await readRequestBody(req) || '{}');
            const user = normalizeUser(body.displayName);
            sendJson(res, 200, { user });
        } catch (error) {
            sendJson(res, 400, { error: error.message || 'Invalid request' });
        }
        return;
    }

    if (pathname === '/api/cloud/sessions' && req.method === 'GET') {
        sendJson(res, 200, { sessions: getUser(userId)?.sessions || [] });
        return;
    }

    if (pathname === '/api/cloud/sessions' && req.method === 'POST') {
        try {
            const body = JSON.parse(await readRequestBody(req) || '{}');
            const user = updateUser(userId, (current) => ({
                ...current,
                sessions: [body.session, ...(current.sessions || []).filter((item) => item.id !== body.session.id)].slice(0, 200),
                lastSyncedAt: new Date().toISOString()
            }));
            sendJson(res, 200, { sessions: user?.sessions || [] });
        } catch (error) {
            sendJson(res, 400, { error: error.message || 'Invalid request' });
        }
        return;
    }

    if (pathname === '/api/cloud/plan' && req.method === 'GET') {
        sendJson(res, 200, { trainingPlan: getUser(userId)?.trainingPlan || null });
        return;
    }

    if (pathname === '/api/cloud/plan' && req.method === 'POST') {
        try {
            const body = JSON.parse(await readRequestBody(req) || '{}');
            const user = updateUser(userId, (current) => ({
                ...current,
                trainingPlan: body.trainingPlan || null,
                lastSyncedAt: new Date().toISOString()
            }));
            sendJson(res, 200, { trainingPlan: user?.trainingPlan || null });
        } catch (error) {
            sendJson(res, 400, { error: error.message || 'Invalid request' });
        }
        return;
    }

    if (pathname === '/api/cloud/profile' && req.method === 'GET') {
        sendJson(res, 200, { skillProfile: getUser(userId)?.skillProfile || null });
        return;
    }

    if (pathname === '/api/cloud/profile' && req.method === 'POST') {
        try {
            const body = JSON.parse(await readRequestBody(req) || '{}');
            const user = updateUser(userId, (current) => ({
                ...current,
                skillProfile: body.skillProfile || null,
                achievements: body.achievements || current.achievements || [],
                streakState: body.streakState || current.streakState || null,
                lastSyncedAt: new Date().toISOString()
            }));
            sendJson(res, 200, {
                skillProfile: user?.skillProfile || null,
                achievements: user?.achievements || [],
                streakState: user?.streakState || null
            });
        } catch (error) {
            sendJson(res, 400, { error: error.message || 'Invalid request' });
        }
        return;
    }

    if (pathname === '/api/cloud/challenge/daily' && req.method === 'GET') {
        const language = requestUrl.searchParams.get('language') || 'en-US';
        sendJson(res, 200, { challenge: getDailyChallenge(language) });
        return;
    }

    if (pathname === '/api/cloud/challenge/result' && req.method === 'POST') {
        try {
            const body = JSON.parse(await readRequestBody(req) || '{}');
            const entry = submitChallengeResult({
                challengeId: body.challengeId,
                userId,
                displayName: getUser(userId)?.displayName || body.displayName,
                sessionId: body.sessionId,
                result: body.result
            });
            sendJson(res, 200, { entry });
        } catch (error) {
            sendJson(res, 400, { error: error.message || 'Invalid request' });
        }
        return;
    }

    if (pathname === '/api/cloud/challenge/leaderboard' && req.method === 'GET') {
        const challengeId = requestUrl.searchParams.get('challengeId');
        const challenge = challengeId ? (getDailyChallenge().id === challengeId ? getDailyChallenge() : getDailyChallenge()) : getDailyChallenge();
        sendJson(res, 200, { leaderboard: challenge.leaderboard || [] });
        return;
    }

    sendJson(res, 404, { error: 'Not found' });
}

/**
 * 当用户还没执行构建时，首页返回明确提示，而不是晦涩的 404。
 */
function sendDevHint(res) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Frontend build not found. Run "npm run dev" for development or "npm run build" before "npm run serve".');
}

/**
 * 提供静态资源服务。
 * 构建产物存在时，从 `dist/` 服务。
 * 不存在时，仅对首页返回开发提示。
 */
function handleStaticFiles(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(requestUrl.pathname);

    if (!DIST_READY) {
        if (pathname === '/' || pathname === '/index.html') {
            sendDevHint(res);
            return;
        }
    }

    const staticRoot = DIST_READY ? DIST_DIR : __dirname;
    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    const resolvedPath = path.resolve(path.join(staticRoot, `.${requestedPath}`));

    /**
     * 防止路径穿越访问到项目外文件。
     */
    if (!resolvedPath.startsWith(staticRoot)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    fs.stat(resolvedPath, (error, stats) => {
        if (!error && stats.isFile()) {
            const extname = path.extname(resolvedPath).toLowerCase();
            const contentType = MIME_TYPES[extname] || 'application/octet-stream';

            fs.readFile(resolvedPath, (readError, content) => {
                if (readError) {
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(`Server Error: ${readError.code}`);
                    return;
                }

                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': extname === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
                });
                res.end(content);
            });
            return;
        }

        /**
         * 构建后模式下，未知路径统一回到 index.html，
         * 让前端 HashRouter 或未来的客户端路由接管。
         */
        if (DIST_READY) {
            const fallback = path.join(DIST_DIR, 'index.html');
            fs.readFile(fallback, (fallbackError, content) => {
                if (fallbackError) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404 Not Found');
                    return;
                }

                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-cache'
                });
                res.end(content);
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
    });
}

/**
 * 创建 HTTP 服务。
 */
const server = http.createServer((req, res) => {
    if (req.url.startsWith('/api/cloud')) {
        handleCloudApi(req, res);
        return;
    }

    if (req.url.startsWith('/api/chat') && req.method === 'POST') {
        handleApiProxy(req, res);
        return;
    }

    handleStaticFiles(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`API proxy endpoint: http://localhost:${PORT}/api/chat`);
    if (!DIST_READY) {
        console.log('No dist build found. Static root will return a development hint until you build the frontend.');
    }
});
