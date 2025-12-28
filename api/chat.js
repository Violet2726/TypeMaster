const https = require('https');
const url = require('url');

// 引入统一配置 (注意路径：.. 代表上一级目录)
const config = require('../config');
const AI_API_KEY = config.AI_API_KEY;
const AI_API_URL = config.AI_API_URL;

module.exports = (req, res) => {
    // 1. 仅接受 POST
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // 2. 解析请求体
    let payload = req.body;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            res.status(400).send('Invalid JSON');
            return;
        }
    }

    // 3. 构造发给 AI 的请求
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

    // 4. 发起请求并流式转发
    const aiReq = https.request(options, (aiRes) => {
        res.writeHead(aiRes.statusCode, aiRes.headers);
        aiRes.pipe(res);
    });

    aiReq.on('error', (e) => {
        console.error('API Request Error:', e);
        res.status(500).send('Internal Server Error');
    });

    aiReq.write(aiReqPayload);
    aiReq.end();
};
