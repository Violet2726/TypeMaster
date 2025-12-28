# TypeMaster ⌨️

一个简约、现代的打字速度测试应用。支持实时 WPM 统计、准确率分析以及 **AI 智能出题**。

🔗 **在线体验**: [https://typing2726.vercel.app/](https://typing2726.vercel.app/)

## ✨ 功能特点

*   **多种模式**：支持倒计时模式 (15/30/60s) 和单词定额模式。
*   **AI 赋能**：集成 GLM-4 模型，自动生成连贯的英语练习文本。
*   **数据可视化**：测试结束后展示 WPM 趋势图、准确率及字符统计。
*   **极致体验**：Serika Dark 深色主题，流畅的输入反馈与动画。

## 🚀 本地运行

1.  **克隆项目**
    ```bash
    git clone <your-repo-url>
    cd typemaster
    ```

2.  **配置 API Key**
    在项目根目录创建 `config.js` 文件：
    ```javascript
    module.exports = {
        AI_API_KEY: "your_api_key_here", // 填入你的智谱 AI Key
        AI_API_URL: "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    };
    ```

3.  **启动服务**
    ```bash
    npm install
    npm start
    # 或者直接: node server.js
    ```

4.  **访问**
    打开浏览器访问 `http://localhost:8080`

## 📦 部署

本项目支持一键部署到 **Vercel**。
由于使用了 Serverless Function (`api/chat.js`) 代理 AI 请求，请确保在 Vercel 后台配置环境变量 `AI_API_KEY` (虽然本项目目前支持从 `config.js` 读取，但推荐使用环境变量)。

---
