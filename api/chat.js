/**
 * Vercel Serverless 版本的 AI 代理。
 *
 * 它与本地 `server.js` 的代理逻辑保持同一套白名单规则，
 * 方便开发环境和部署环境表现一致。
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

let AI_API_KEY = process.env.AI_API_KEY;
let AI_API_URL = process.env.AI_API_URL;

try {
    const config = require('../config');
    if (config.AI_API_KEY) AI_API_KEY = config.AI_API_KEY;
    if (config.AI_API_URL) AI_API_URL = config.AI_API_URL;
} catch (error) {
    console.log('Config file not found, using environment variables');
}

/**
 * 根据目标地址选择 http / https。
 */
function getTransport(targetUrl) {
    return targetUrl.protocol === 'http:' ? http : https;
}

/**
 * 白名单化上游请求体。
 */
function buildProxyPayload(payload) {
    const body = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const safePayload = {
        model: typeof body.model === 'string' ? body.model : 'glm-4.7-flash',
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

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    if (!AI_API_KEY || !AI_API_URL) {
        res.status(500).send('Missing AI_API_KEY or AI_API_URL');
        return;
    }

    let payload;
    try {
        payload = buildProxyPayload(req.body);
    } catch (error) {
        res.status(400).send('Invalid JSON');
        return;
    }

    const targetUrl = new URL(AI_API_URL);
    const transport = getTransport(targetUrl);
    const serializedBody = JSON.stringify(payload);

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
            res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
            proxyRes.pipe(res);
        }
    );

    proxyReq.on('error', (error) => {
        console.error('API Request Error:', error);
        res.status(500).send('Internal Server Error');
    });

    proxyReq.write(serializedBody);
    proxyReq.end();
};
