// 集中管理配置信息
module.exports = {
    // 优先使用环境变量 (适配 Vercel)，如果不存在则使用硬编码 (适配本地)
    AI_API_KEY: process.env.AI_API_KEY || "94a7aa623f314a069d394926191f54fd.g5GIUDJF9pJ8a7ZH",
    AI_API_URL: "https://open.bigmodel.cn/api/paas/v4/chat/completions"
};
