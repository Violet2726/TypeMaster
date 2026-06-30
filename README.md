[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster

TypeMaster 是一个围绕 `TypeRift / Focus Lab / Missions / Insights` 闭环设计的英文打字训练工作台。

当前大版本以 `TypeRift: Echo Siege` 作为主游戏入口：玩家在 Roguelite 生存局中输入敌人词条、升级武器/遗物/符文，并把暴露出的弱字符回流到短训练和洞察系统。旧游戏逻辑与历史数据不再兼容，v7 是新的游戏数据起点。

## 工作区结构

```text
typemaster/
|-- apps/
|   |-- web/               # Next.js + React 产品应用
|   `-- api/               # Hono API、静态服务与 Vercel 兼容入口
|-- packages/
|   |-- ai/                # AI 文本生成与教练反馈客户端
|   |-- config/            # 共享 Vitest/config 辅助
|   |-- contracts/         # Zod API 契约、存储 key 与缓存 schema
|   |-- domain/            # 纯领域规则：打字、训练、洞察、TypeRift
|   `-- ui/                # 共享 UI 原语
|-- docs/                  # 跨模块设计与维护文档
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- turbo.json
```

## 产品模块

- `TypeRift: Echo Siege`：主游戏模块，路径暂保留 `/raid` 作为导航兼容入口，但 UI、测试、数据模型统一使用 TypeRift/game 命名。
- `Focus Lab`：短训练模块，用于修复 TypeRift 和日常练习暴露出的弱字符、节奏和准确率问题。
- `Missions`：校准、日常任务和训练计划入口，服务于 TypeRift 前后的训练节奏。
- `Insights`：复盘速度、准确率、弱字符、游戏深度、撤离稳定性和成就进展。

更多游戏模块细节见 [docs/typerift-v7.md](./docs/typerift-v7.md)。

## 主要边界

- `apps/web/app`：Next.js App Router route tree 与根 layout。
- `apps/web/src/application`：providers、query client、app shell 和导航适配。
- `apps/web/src/screens`：Home、Game、Practice、Missions、Insights、Result 等页面编排层。
- `apps/web/src/features/game-vnext`：TypeRift Web 运行时、Canvas renderer、asset loader、HUD 与 overlay。
- `apps/web/src/services/api`：浏览器侧 API gateway 与本地 API fallback cache。
- `apps/web/src/services/storage`：浏览器 preferences 与 IndexedDB client cache repository。
- `apps/web/src/store`：Zustand/React Query 桥接、持久化、feature action 适配和可测试产品 use case。
- `apps/api/routes`：按 API 边界拆分的 Hono route。
- `apps/api/services`：用户、会话、计划、画像、挑战和静态资源服务。
- `apps/api/repositories`：服务层数据边界；优先使用 Postgres/Drizzle，未配置时回退到本地 JSON state。
- `apps/api/infra`：Clerk 身份、Postgres/Drizzle、Upstash Redis 和 Inngest 适配器。
- `apps/api/jobs`：教练反馈生成、画像重算和排行榜缓存刷新等后台函数。
- `packages/contracts/src`：共享 storage key、API schema、server-state schema 与 OpenAPI 元信息。
- `packages/domain/src`：无 React、无 IO 的纯领域规则。
- `packages/domain/src/game-vnext`：TypeRift 纯领域模块，导出 `createGameState`、`dispatchGameCommand`、`updateGameState`、`buildGameSnapshot`、`buildGameResult` 和 `GAME_MODES`。

## 数据与存储口径

- 当前客户端存储前缀为 `typemaster:v7:*`。
- `TrainingDataBundleSchema.version` 为 `7`。
- TypeRift 结算写入统一 session：`kind: 'game'`、`trainingMeta.type: 'game'`、`gameMeta.version: 'typerift-v1'`。
- 旧 v6 keys 与 `typing-raid-*` keys 只作为 `OBSOLETE_STORAGE_KEYS` 清理对象，不再作为数据来源，也不迁移旧游戏历史。
- 首页、任务、洞察、成就和图鉴只读取 v7 game session 字段。

## TypeRift 资产

游戏位图资产位于 `apps/web/public/game/typerift/`：

- `backgrounds/`：5 个区域背景。
- `enemies/`：12 类普通敌人精灵。
- `bosses/`：5 个区域 Boss 精灵。
- `relics/`：24 个武器/遗物/符文图标。
- `manifest.json`：运行时 asset loader 使用的清单。

Canvas 负责粒子、光效、弹道、HUD 辅助和 fallback；核心背景、敌人、Boss、图标优先使用位图资产。

## 环境要求

- Node.js `20.9+`
- pnpm `10+`

## AI 配置

AI 功能是可选的。内置文本、Focus Lab 和 TypeRift 游戏流程不依赖 AI。

```bash
AI_API_KEY=your_key_here
AI_API_URL=your_url_here
NEXT_PUBLIC_TYPEMASTER_AI_PROXY=1
```

也可以在仓库根目录的 `config.js` 放置服务端 AI 配置：

```js
module.exports = {
  AI_API_KEY: "your_key_here",
  AI_API_URL: "your_url_here"
};
```

`NEXT_PUBLIC_TYPEMASTER_AI_PROXY=1` 只是前端功能开关，密钥只保留在 API 侧。

## 服务端基础设施配置

未设置生产基础设施变量时，本地开发会继续使用 JSON state 和本地开发 bearer token。

```bash
CLERK_SECRET_KEY=sk_...
CLERK_JWT_KEY=...
CLERK_AUTHORIZED_PARTIES=http://localhost:5173
DATABASE_URL=postgres://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
INNGEST_DEV=1
```

- API 身份入口统一走 `Authorization: Bearer <token>`；生产 token 由 Clerk 校验，本地未配置 Clerk 时使用 `typemaster-local:<userId>`。
- 后端 user/session/plan/profile/challenge 服务统一通过 `apps/api/repositories/training-repository.ts` 访问数据。
- Postgres 表定义位于 `apps/api/infra/db/schema.ts`；迁移入口为 `pnpm --filter @typemaster/api db:generate` 和 `pnpm --filter @typemaster/api db:push`。
- Inngest worker 暴露在 `/api/inngest`；当前用于教练反馈、画像重算和挑战排行榜刷新。

## 本地开发

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

主要地址：

- Web: `http://localhost:5173`
- API: `http://localhost:8080`
- TypeRift: `http://localhost:5173/raid`

开发态 Next.js rewrites 会把 Web 里的 `/api` 转发到 `http://localhost:8080`。

## 验证命令

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

针对 TypeRift 的重点验证：

- `packages/domain`：确定性 seed、生成、锁定、输入命中、错误惩罚、击杀、泄漏、Boss 阶段、升级与结算。
- `apps/web`：模式选择、HUD、升级 overlay、结算写入 v7 game session。
- Playwright：`/raid` 首屏、Canvas 非空、桌面/移动无明显遮挡、资产失败 fallback。

## 运行模型

- 路由使用 Next.js App Router 浏览器路径，不使用 hash route。
- `/raid` 是 TypeRift 的保留入口路径，不代表内部仍使用旧游戏模型。
- React Query 管理 account、sessions、plans、skill profiles、daily challenges 等 API 快照。
- Zustand 管理当前输入草稿、运行时控制、UI 偏好和进行中的训练流。
- Store action hook 保持薄层适配；账号同步、草稿生成、训练启动、教练反馈和会话完成等产品流程放在 `*-use-cases.ts` 中。
- `packages/contracts` 是 Web/API request 与 response shape 的共享契约来源。
- `packages/domain` 是打字、训练、TypeRift 和洞察规则的单一领域来源。

## 建议阅读顺序

1. [`apps/web/app/layout.tsx`](./apps/web/app/layout.tsx)
2. [`apps/web/app/page.tsx`](./apps/web/app/page.tsx)
3. [`apps/web/src/screens/GamePage.tsx`](./apps/web/src/screens/GamePage.tsx)
4. [`apps/web/src/features/game-vnext/runtime/game-engine.ts`](./apps/web/src/features/game-vnext/runtime/game-engine.ts)
5. [`apps/web/src/features/game-vnext/runtime/canvas-renderer.ts`](./apps/web/src/features/game-vnext/runtime/canvas-renderer.ts)
6. [`packages/domain/src/game-vnext/index.js`](./packages/domain/src/game-vnext/index.js)
7. [`apps/web/src/store/session-completion-use-cases.ts`](./apps/web/src/store/session-completion-use-cases.ts)
8. [`apps/web/src/services/storage/json-store.ts`](./apps/web/src/services/storage/json-store.ts)
9. [`packages/contracts/src/index.js`](./packages/contracts/src/index.js)
10. [`docs/typerift-v7.md`](./docs/typerift-v7.md)
