[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster 2.0

一个以 `AI 教练` 为核心的打字训练应用。  
当前版本已经从旧的单文件前端演进为 `React + Vite + Node API Proxy` 架构，并完成首个 2.0 开发切片：

- AI 训练工坊
- React 练习页 / 结果页 / 教练页
- 自动生成 AI 教练建议
- 本地历史记录与设置持久化
- 下一练建议回填

## 当前版本重点

### 产品能力

- `标准词库练习`：不依赖 AI，也能直接开始练习
- `AI 训练工坊`：支持主题模板、难度、标点、数字配置
- `结果页诊断`：练习结束后自动生成本次总结、主要问题、亮点和下一练建议
- `教练页`：查看最近一次完整建议和最近几次练习摘要
- `本地持久化`：最近 50 条练习记录、设置项、教练建议会保存在浏览器本地

### 技术能力

- `React + Vite`：前端采用组件化结构和 HashRouter
- `Node API Proxy`：本地通过 `server.js` 代理 `/api/chat`
- `Vercel Serverless`：部署时可使用 `api/chat.js` 作为同构代理入口
- `本地兜底教练`：如果 AI 建议生成失败，结果页会回退到本地规则建议

## 目录结构

```text
typemaster/
├─ api/
│  └─ chat.js                    # Vercel Serverless 代理
├─ docs/
│  └─ v2-major-update-plan.md    # 2.0 版本规划文档
├─ src/
│  ├─ components/                # 通用 UI 组件
│  ├─ data/                      # 内置数据，例如高频词库
│  ├─ engine/                    # 练习引擎：配置、草稿、渲染模型、统计、教练规则
│  ├─ hooks/                     # React 业务 hook
│  ├─ pages/                     # 页面级组件
│  ├─ services/                  # AI 服务、本地存储、云端契约占位
│  ├─ store/                     # 全局业务状态
│  ├─ App.jsx                    # 应用根组件
│  └─ main.jsx                   # 前端入口
├─ index.css                     # 全局样式与主题
├─ index.html                    # Vite HTML 入口
├─ server.js                     # 本地 Node 代理 + 静态资源服务
├─ vite.config.js                # Vite 配置
├─ package.json
└─ README.md / README_EN.md
```

## 环境要求

- Node.js `18+`
- npm `9+` 或兼容版本

## AI 配置

如果你只想体验标准词库模式，可以跳过这一步。  
如果你要使用 `AI 训练工坊` 和 `AI 教练建议`，需要提供：

- `AI_API_KEY`
- `AI_API_URL`

你可以使用以下任一方式配置：

### 方式 1：本地 `config.js`

```js
module.exports = {
  AI_API_KEY: "your_key_here",
  AI_API_URL: "your_url_here"
};
```

说明：
- `config.js` 已被 `.gitignore` 忽略
- 本地 `server.js` 和 `api/chat.js` 都会优先读取它

### 方式 2：环境变量

```bash
AI_API_KEY=your_key_here
AI_API_URL=your_url_here
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 API 代理

在终端 A 中运行：

```bash
npm run api
```

默认监听：

```text
http://localhost:8080
```

### 3. 启动前端开发服务器

在终端 B 中运行：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:5173/#/
```

说明：
- 开发模式下，Vite 会把 `/api` 代理到 `http://localhost:8080`
- HashRouter 已启用，因此页面路径会出现在 `#/...`

## 构建后运行

### 构建前端

```bash
npm run build
```

### 启动本地静态服务 + API 代理

```bash
npm run serve
```

访问：

```text
http://localhost:8080/#/
```

### 一条命令方式

```bash
npm start
```

说明：
- `npm start` 会先执行 `npm run build`
- 然后启动 `server.js`

## 脚本说明

```bash
npm run dev      # 启动 Vite 前端开发服务器
npm run api      # 启动本地 Node 代理服务
npm run build    # 构建前端到 dist/
npm run preview  # 使用 Vite preview 预览构建产物
npm run serve    # 使用 server.js 托管 dist/ 并提供 /api/chat
npm start        # 先 build，再 serve
```

## 关键业务流

### 练习流

1. 用户在练习页选择 `标准词库` 或 `AI 训练`
2. AI 模式下可以选择模板和难度
3. 练习完成后自动写入本地历史
4. 结果页自动触发 AI 教练建议生成
5. 如果 AI 失败，自动回退到本地规则教练
6. 用户可以点击“下一练建议”直接开始下一轮 AI 练习

### 数据流

- `settings`：保存在 localStorage
- `sessions`：最近 50 条练习记录保存在 localStorage
- `coachAdvices`：最近 50 条教练建议保存在 localStorage
- `challenge / sync`：当前仅保留前端契约，不连接真实后端

## 架构说明

### 前端分层

- `pages`：页面级入口，负责把业务模块串起来
- `components`：纯展示组件
- `hooks`：页面级交互时序与副作用
- `store`：全局业务状态协调
- `services`：AI、本地存储、云端占位契约
- `engine`：练习规则、统计、草稿和本地教练规则

### 后端代理

- `server.js`：本地 Node 服务，兼顾静态资源和 `/api/chat`
- `api/chat.js`：Vercel Serverless 代理

两者都采用同样的请求白名单策略，允许前端传递：

- `messages`
- `stream`
- `temperature`
- `max_tokens`
- `response_format`
- `model`

## 文档

- 2.0 规划文档：[docs/v2-major-update-plan.md](./docs/v2-major-update-plan.md)

## 当前限制

- 暂无真实账号体系
- 暂无跨设备同步
- 暂无真实挑战后端
- 暂无自动化测试套件

## 建议阅读顺序

如果你是新接手这个项目的开发者，建议按这个顺序阅读：

1. `src/App.jsx`
2. `src/store/practice-store.jsx`
3. `src/hooks/useTypingSession.jsx`
4. `src/engine/`
5. `src/services/ai-service.js`
6. `server.js` / `api/chat.js`

---

TypeMaster 2.0 当前处于“首个 2.0 切片已落地，可继续沿 AI 教练主线扩展”的状态。
