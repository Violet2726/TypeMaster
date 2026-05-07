# 版本发布记录---

## 版本 2.0.1

### 发布日期
2026-05-08

### 变更类型
test

### 用户可见变化
无直接用户可见变化。本次更新建立了 engine 核心模块的自动化测试基线，为后续迭代提供质量保障，避免修改 engine 时引入回归 bug。

### 技术变化

**测试基础设施**
- 引入 Vitest ^2.1.0 测试框架
- 添加 jsdom ^29.1.1 用于 React 测试环境
- 新增 `vitest.config.js` 配置文件

**新增测试文件**
- `src/engine/__tests__/metrics.test.js` - metrics 模块 28 个测试用例
- `src/engine/__tests__/coach.test.js` - coach 模块 11 个测试用例
- `src/engine/__tests__/insights.test.js` - insights 模块 17 个测试用例

**测试覆盖范围**
| 模块 | 测试函数 |
|------|----------|
| metrics.js | calculateMetrics, calculateConsistency, collectErrorBreakdown, deriveComparison |
| coach.js | buildLocalCoachAdvice |
| insights.js | buildInsights |

**package.json 更新**
- 新增脚本：`npm run test` (vitest run)
- 新增脚本：`npm run test:coverage` (vitest run --coverage)
- devDependencies 添加：vitest, jsdom

### 验证结果

| 命令 | 状态 | 说明 |
|------|------|------|
| npm install | ✅ 通过 | 成功安装 vitest 和 jsdom |
| npm run build | ✅ 通过 | 构建产物正常生成 |
| npm test | ✅ 通过 | 56 个测试全部通过 |
| npm run test:coverage | ✅ 可用 | 可生成覆盖率报告 |

### 已知问题
- 当前仅覆盖 engine 模块的纯函数
- UI 组件、异步逻辑 (services/ai-service.js)、Hooks 未纳入测试范围
- 后续可逐步扩展测试覆盖范围

---

## 版本 2.0.0

### 发布日期
2026-05-07

### 主要功能

**产品能力**
- 双入口首页：支持直接开始 AI 训练或快速进入标准练习
- 训练工作台：练习页拆分为配置区、AI 工坊和打字区
- AI 文本状态管理：支持 idle / loading / ready / stale / error
- 结果页反馈：展示 WPM、Raw WPM、准确率、一致性、字符统计、趋势图
- 教练建议兜底：AI 建议失败时自动退回本地规则建议
- 成长洞察页：汇总最近建议、趋势、最佳 WPM、平均准确率等
- 双语界面：支持简体中文 / English
- 本地持久化：设置、练习记录、教练建议存入 localStorage

**技术能力**
- React 18 + Vite 前端框架
- React Router Data Router + Hash URL 路由方案
- Node 本地代理：通过 server.js 暴露 /api/chat
- Vercel Serverless 代理：通过 api/chat.js 兼容部署环境
- 本地规则引擎：打字草稿、统计指标、趋势、洞察和本地教练逻辑

### 页面结构
- `/` - 首页：双入口首屏、最近建议、最近训练概览
- `/practice` - 练习页：配置、AI 工坊、打字区
- `/result` - 结果页：结算、问题总结、亮点、下一练建议、趋势图
- `/insights` - 成长洞察页：长期表现和错误热点
- `/coach` - 旧入口：自动重定向到 /insights

### AI 训练闭环
1. 进入练习页并切换到 AI 来源
2. 选择模板与难度
3. 生成训练文本
4. 完成一轮练习
5. 结果页自动生成 AI 教练建议
6. 如 AI 失败，则使用本地规则建议兜底
7. 可直接从结果页发起下一练

### 本地存储约定
- `settings`：主题、字号、专注模式、语言、上次练习配置
- `sessions`：最近 50 次练习记录
- `coachAdvices`：最近 50 条教练建议

### 状态合同
- `aiPracticeStatus = idle | loading | ready | stale | error`
- `coach status = idle | loading | success | fallback | error`

### 已知限制
- 还没有账号系统
- 还没有跨设备同步
- challenge / sync 仍然只是前端契约占位
- 还没有自动化测试套件

---

## 版本记录格式

### 版本号格式
X.Y.Z

- X：重大版本更新，可能包含不兼容变更
- Y：次要功能更新，向后兼容
- Z：补丁修复，向后兼容

### 记录内容
- 发布日期：YYYY-MM-DD
- 主要功能：新增或改进的功能
- 技术改进：技术架构或性能改进
- 修复问题：修复的 bug 列表
- 已知限制：当前版本的已知问题和限制