[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster

TypeMaster 是一个面向英文打字训练的 `AI Training Studio`。当前版本已经从单纯练习工具升级为 `诊断 / 计划 / 挑战 / 自由练习 / 结果复盘 / 成长洞察` 的训练闭环，核心目标是减少用户决策成本，让每次打开产品都能知道今天最值得练什么。

它提供四条训练路径：

- `能力诊断`：用三轮短测试生成能力画像和 7 天起步计划
- `计划训练`：根据短板安排下一轮训练，减少重复选择
- `今日挑战`：固定文本和配置，比较速度、准确率和稳定输出
- `自由练习`：支持标准词库、自定义词库和 AI 生成文本

## 当前版本包含什么

### 产品能力

- `今日训练首页`：把诊断、计划、挑战和自由练习组织成清晰的行动中心
- `诊断与 7 天计划`：完成能力采样后自动生成等级、短板和起步训练计划
- `今日挑战`：支持共享文本、个人最佳、同级对比、趋势复盘和榜单入口
- `训练工作台`：练习页拆分为配置区、自定义词库、AI 工坊和打字区，AI 训练采用明确三步流转
- `AI 文本状态管理`：支持 `idle / loading / ready / stale / error`，配置变更后会要求重新生成文本
- `结果页反馈`：展示 WPM、Raw WPM、准确率、一致性、字符统计、趋势图，以及 AI 教练建议
- `教练建议兜底`：AI 建议失败时，会自动退回本地规则建议，并保留明确状态
- `成长洞察页`：汇总最近建议、近 7/30 次趋势、最佳 WPM、平均准确率、AI 使用占比、高频错误字符/单词和最近历史
- `双语界面`：支持 `简体中文 / English`，语言设置持久化到本地
- `本地持久化`：设置、最近 50 次练习记录、最近 50 条教练建议都会存入 `localStorage`
- `桌面 / 移动体验分流`：桌面端保持内嵌打字体验，移动端使用显式输入框避免软键盘场景迷失

### 技术能力

- `React 18 + Vite` 前端
- `React Router Data Router + Hash URL` 路由方案，地址形如 `#/practice`
- `Node 本地代理`：通过 [`server.js`](./server.js) 暴露 `/api/chat`
- `Vercel Serverless 代理`：通过 [`api/chat.js`](./api/chat.js) 兼容部署环境
- `本地规则引擎`：打字草稿、统计指标、趋势、洞察和本地教练逻辑均在 `src/engine/` 中维护

## 页面与核心流程

### 页面结构

- `首页 /`：今日训练行动中心、计划续接、挑战状态、自由练习和最近记录
- `诊断 /diagnostic`：三轮短测试入口和诊断进度
- `计划 /plan`：当前训练计划、进度和下一步入口
- `挑战 /challenge`：今日榜单、趋势、同级对比和挑战回放
- `练习 /practice`：配置、AI 工坊、打字区
- `结果 /result`：结算、问题总结、亮点、下一练建议、趋势图
- `成长洞察 /insights`：长期表现和错误热点
- `旧入口 /coach`：自动重定向到 `/insights`

### AI 训练闭环

1. 进入练习页并切换到 `AI` 来源
2. 选择模板与难度
3. 生成训练文本
4. 完成一轮练习
5. 结果页自动生成 AI 教练建议
6. 如 AI 失败，则使用本地规则建议兜底
7. 可直接从结果页发起 `下一练`

## 项目结构

```text
typemaster/
├─ api/
│  └─ chat.js                    # Vercel Serverless AI 代理
├─ docs/
│  └─ v2-major-update-plan.md    # 历史版本规划文档
├─ src/
│  ├─ components/                # Header、设置抽屉、图表、确认弹窗、打字区等
│  ├─ data/                      # 标准词库等静态数据
│  ├─ engine/                    # 配置常量、草稿生成、统计、洞察、本地教练规则
│  ├─ hooks/                     # 练习时序与输入控制
│  ├─ i18n/                      # 中英文文案与格式化方法
│  ├─ pages/                     # Home / Diagnostic / Plan / Challenge / Practice / Result / Insights
│  ├─ services/                  # AI 调用、本地存储、云端契约占位
│  ├─ store/                     # 全局业务状态编排
│  ├─ App.jsx                    # 应用路由与壳层
│  └─ main.jsx                   # 前端入口
├─ index.css                     # 全局样式与主题系统
├─ server.js                     # 本地静态服务 + /api/chat 代理
├─ package.json
└─ README.md / README_EN.md
```

## 环境要求

- Node.js `18+`
- npm `9+` 或兼容版本

## AI 配置

如果你只使用标准词库训练，可以跳过这一节。  
如果你要启用 `AI 训练工坊` 或 `AI 教练建议`，需要提供：

- `AI_API_KEY`
- `AI_API_URL`

支持两种方式：

### 方式一：本地 `config.js`

在项目根目录创建 `config.js`：

```js
module.exports = {
  AI_API_KEY: "your_key_here",
  AI_API_URL: "your_url_here"
};
```

说明：

- `config.js` 已被 `.gitignore` 忽略
- [`server.js`](./server.js) 和 [`api/chat.js`](./api/chat.js) 都会优先读取它

### 方式二：环境变量

```bash
AI_API_KEY=your_key_here
AI_API_URL=your_url_here
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动本地 API 代理

终端 A：

```bash
npm run api
```

默认地址：

```text
http://localhost:8080
```

### 3. 启动前端开发服务

终端 B：

```bash
npm run dev
```

打开：

```text
http://localhost:5173/#/
```

说明：

- 开发时，Vite 会把 `/api` 代理到 `http://localhost:8080`
- 云端账户、同步和挑战接口默认使用浏览器本地契约，不会请求 `/api/cloud`；需要联调 Node 云端占位接口时，先启动 `npm run api`，再设置 `VITE_TYPEMASTER_REMOTE_CLOUD=1`
- 当前使用的是 `Hash` 路由，因此地址会显示为 `#/...`

## 构建与运行

### 构建前端

```bash
npm run build
```

### 启动构建产物

```bash
npm run serve
```

打开：

```text
http://localhost:8080/#/
```

### 一键启动

```bash
npm start
```

说明：

- `npm start` 会先执行 `npm run build`
- 然后启动 [`server.js`](./server.js)

## 可用脚本

```bash
npm run dev      # 启动 Vite 前端开发服务
npm run api      # 启动本地 Node 代理
npm run build    # 构建前端到 dist/
npm run preview  # 用 Vite 预览构建结果
npm run serve    # 用 server.js 提供 dist/ 与 /api/chat
npm start        # 先构建，再启动本地服务
npm test         # 运行单元测试
npm run test:coverage  # 运行单元测试并生成覆盖率报告
```

## 数据与状态约定

### 本地存储

- `settings`：主题、字号、专注模式、语言、上次练习配置
- `sessions`：最近 50 次练习记录
- `coachAdvices`：最近 50 条教练建议

### 关键状态合同

- `aiPracticeStatus = idle | loading | ready | stale | error`
- `coach status = idle | loading | success | fallback | error`

前端页面统一消费这些显式状态，不再依赖隐式推断。

## 架构说明

### 前端分层

- `pages`：路由级页面
- `components`：通用 UI 组件
- `hooks`：输入、焦点、计时、结束判定
- `store`：练习配置、草稿、历史、AI 状态、教练状态统一编排
- `services`：AI 请求、本地存储、云端接口占位
- `engine`：练习规则、文本草稿、指标计算、趋势与洞察规则

### 代理层

- [`server.js`](./server.js)：本地开发和本地部署共用的 Node 代理
- [`api/chat.js`](./api/chat.js)：Vercel Serverless 版本

两者都使用同一套字段白名单，只允许前端透传安全字段给上游模型接口。

## 当前限制

- 还没有账号系统
- 还没有跨设备同步
- `challenge / sync` 仍然只是前端契约占位
- 自动化测试套件处于初始阶段，目前仅覆盖 engine 核心模块
- 包版本号目前仍停留在 `package.json` 的 `2.0.0`，但当前代码已经是更新后的体验版本

## 建议阅读顺序

如果你要快速熟悉这个项目，建议按下面顺序看：

1. [`src/App.jsx`](./src/App.jsx)
2. [`src/store/practice-store.jsx`](./src/store/practice-store.jsx)
3. [`src/pages/PracticePage.jsx`](./src/pages/PracticePage.jsx)
4. [`src/hooks/useTypingSession.jsx`](./src/hooks/useTypingSession.jsx)
5. [`src/engine/`](./src/engine)
6. [`src/services/ai-service.js`](./src/services/ai-service.js)
7. [`server.js`](./server.js) / [`api/chat.js`](./api/chat.js)

## 相关文档

- 历史版本规划：[docs/v2-major-update-plan.md](./docs/v2-major-update-plan.md)

---

TypeMaster 目前更适合作为一个围绕 `AI 教练 + 本地训练数据` 持续迭代的前端产品基线。后续如果继续扩展，优先方向通常会是账号、同步、挑战机制和更细的练习模式。
