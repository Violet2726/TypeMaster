[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster ⌨️

一个简约、现代的打字速度测试应用，集成 AI 智能出题功能。

🔗 **在线体验**: [https://typing2726.vercel.app/](https://typing2726.vercel.app/)

## ✨ 特性

*   **智能出题**: 基于 AI 模型生成的连贯英语文本，告别枯燥的随机单词。
*   **多模式**: 支持倒计时 (Time) 和定额单词 (Words) 模式。
*   **隐私安全**: 采用后端代理架构 (Serverless)，API Key 绝不暴露给前端。
*   **数据分析**: 实时 WPM、准确率统计以及图表分析。
*   **极简设计**: Serika Dark 深色主题，专注于打字体验。

## ☁️ 部署指南 (Vercel)

本项目已针对 Vercel Serverless 进行优化。

1.  **Fork/Clone** 本仓库到你的 GitHub。
2.  在 **Vercel** 中导入本项目。
3.  **配置环境变量 (Environment Variables)**:
    为了让 AI 功能正常工作，请在 Vercel 项目设置中添加：
    *   `AI_API_KEY`: AI Key
    *   `AI_API_URL`: AI API 地址
4.  保存并部署。

## 🛠️ 本地开发

1.  **环境准备**
    确保安装了 Node.js (v18+)。

2.  **Clone 项目**
    ```bash
    git clone https://github.com/your-username/typemaster.git
    cd typemaster
    ```

3.  **配置密钥**
    复制 `config.js` 并填入你的 Key：
    ```javascript
    // config.js
    module.exports = {
        AI_API_KEY: "your_key_here",
        AI_API_URL: "your_url_here"
    };
    ```

4.  **运行服务**
    必须通过后端服务启动 (代理 API 请求)：
    ```bash
    node server.js
    ```

5.  **访问**
    打开浏览器访问 `http://localhost:8080`

## 📂 项目结构

*   `/api`: Vercel Serverless 函数 (代理 AI 请求)
*   `server.js`: 本地开发服务器 (提供静态资源 + API 代理)
*   `app.js`: 前端核心逻辑
*   `config.js`: 本地配置文件 (已在 .gitignore 中忽略)

---
Designed for Typing Enthusiasts.
