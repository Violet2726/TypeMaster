const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 引入统一配置
const config = require('./config');
const AI_API_KEY = config.AI_API_KEY;
const AI_API_URL = config.AI_API_URL;

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    if (req.url === '/api/chat' && req.method === 'POST') {
        handleApiProxy(req, res);
        return;
    }
    handleStaticFiles(req, res);
});

function handleApiProxy(clientReq, clientRes) {
    let body = '';
    clientReq.on('data', chunk => {
        body += chunk.toString();
    });

    clientReq.on('end', () => {
        let payload;
        try {
            payload = JSON.parse(body);
        } catch (e) {
            clientRes.writeHead(400);
            clientRes.end('Invalid JSON');
            return;
        }

        const aiReqPayload = JSON.stringify({
            model: "glm-4-flash",
            messages: payload.messages,
            stream: true,
            max_tokens: 4096,
            temperature: 0.8
        });

        const targetUrl = new url.URL(AI_API_URL);

        const options = {
            hostname: targetUrl.hostname,
            path: targetUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            }
        };

        const aiReq = https.request(options, (aiRes) => {
            clientRes.writeHead(aiRes.statusCode, aiRes.headers);
            aiRes.pipe(clientRes);
        });

        aiReq.on('error', (e) => {
            console.error('API Request Error:', e);
            clientRes.writeHead(500);
            clientRes.end('Internal Server Error');
        });

        aiReq.write(aiReqPayload);
        aiReq.end();
    });
}

function handleStaticFiles(req, res) {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    filePath = filePath.split('?')[0];
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.startsWith('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Secure API Proxy endpoint: http://localhost:${PORT}/api/chat`);
});
