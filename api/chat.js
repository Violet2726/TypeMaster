const https = require('https');
const url = require('url');

// 尝试读取 config.js (本地环境)，如果不存在 (Vercel 环境) 则使用环境变量
let AI_API_KEY = process.env.AI_API_KEY;
let AI_API_URL = process.env.AI_API_URL;

try {
    const config = require('../config');
    if (config.AI_API_KEY) AI_API_KEY = config.AI_API_KEY;
    if (config.AI_API_URL) AI_API_URL = config.AI_API_URL;
} catch (error) {
    // config.js 不存在，忽略错误，依赖环境变量
    console.log("Config file not found, using Environment Variables");
}

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
