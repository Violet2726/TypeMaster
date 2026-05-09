# TypeMaster 架构说明

## 技术栈

- **前端框架**: React 18 + Vite
- **路由**: React Router Data Router + Hash URL
- **状态管理**: React Context + useReducer
- **测试**: Vitest
- **CI/CD**: GitHub Actions

## 项目结构

```
typemaster/
├─ api/
│  └─ chat.js                    # Vercel Serverless AI 代理
├─ .github/workflows/
│  └─ ci.yml                     # GitHub Actions CI 配置
├─ docs/
│  ├─ ai-iteration/              # 原始迭代文档
│  └─ auto-iteration/            # 自治迭代文档
│     ├─ state.md               # 自治状态
│     ├─ today.md               # 今日上下文
│     ├─ architecture.md        # 本文件
│     ├─ quality-gate.md         # 质量门禁
│     ├─ decision-log.md         # 决策记录
│     ├─ daily-report.md         # 每日报告
│     ├─ backlog.md             # 需求池
│     ├─ release-notes.md        # 发布记录
│     ├─ refactor-debt.md        # 技术债
│     └─ failure-log.md          # 失败日志
├─ src/
│  ├─ components/               # UI 组件
│  ├─ data/                      # 静态数据
│  ├─ engine/                    # 核心引擎
│  │  ├─ draft.js              # 练习文本生成
│  │  ├─ metrics.js            # 统计指标计算
│  │  ├─ coach.js              # 教练建议逻辑
│  │  ├─ insights.js           # 成长洞察计算
│  │  ├─ session-machine.js    # 打字状态机纯函数
│  │  └─ __tests__/            # 单元测试
│  ├─ hooks/                     # React Hooks
│  ├─ i18n/                      # 国际化
│  ├─ pages/                     # 页面组件
│  ├─ services/                   # 服务层
│  │  ├─ ai-service.js         # AI 调用
│  │  ├─ storage.js            # 本地存储
│  │  └─ cloud-contracts.js    # 云端契约
│  ├─ store/                     # 全局状态
│  ├─ App.jsx                    # 应用入口
│  └─ main.jsx                   # 前端入口
├─ server.js                      # 本地代理
└─ package.json
```

## 核心模块

### Engine 模块
纯函数模块，不依赖 React，用于：
- `draft.js`: 练习文本生成（标准词库 + AI）
- `metrics.js`: WPM、准确率、稳定度计算
- `coach.js`: 教练建议生成（本地规则 + AI）
- `insights.js`: 成长洞察数据聚合
- `session-machine.js`: 打字状态机纯函数（状态转换、计时、输入处理）

### Services 模块
- `ai-service.js`: AI API 调用，包含兜底逻辑
- `storage.js`: localStorage 封装
- `cloud-contracts.js`: 云端接口占位

### Pages 模块
- `HomePage.jsx`: 首页
- `PracticePage.jsx`: 练习页
- `ResultPage.jsx`: 结果页
- `InsightsPage.jsx`: 成长洞察页

## 数据流

```
用户输入 → useTypingSession → practice-store → engine/metrics
                                              ↓
                                       计算结果 → ResultPage
                                              ↓
                                       coach/insights
                                              ↓
                                       coachAdvice/sessions (localStorage)
```

## 状态合同

- `aiPracticeStatus = idle | loading | ready | stale | error`
- `coachStatus = idle | loading | success | fallback | error`

## 测试体系

### Engine 模块测试
- 位置: `src/engine/__tests__/`
- 环境: Vitest node 环境
- 覆盖: metrics.js, coach.js, insights.js, session-machine.js
- 测试数: 117 个

### Hooks 测试策略
- 原则: 抽取纯函数到 `src/engine/` 进行测试
- Hook 本身负责 React 生命周期和状态编排
- 不直接在 hooks 目录写测试，而是提取可测试的纯逻辑
- `useTypingSession`: 核心逻辑已抽取到 `session-machine.js` 进行测试（61 个测试用例）

### Services 测试策略
- storage.js: 可在 node 环境测试 JSON parse/stringify 和边界情况
- ai-service.js: mock fetch 或测试错误归类逻辑

## localStorage 约定

- `settings`: 主题、字号、专注模式、语言
- `sessions`: 最近 50 次练习记录
- `coachAdvices`: 最近 50 条教练建议
