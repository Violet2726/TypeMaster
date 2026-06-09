[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster

TypeMaster 是一个围绕 `assessment / plan / challenge / practice / review` 闭环设计的英文打字训练器。

当前仓库已经迁移为 pnpm + Turborepo workspace，让 Web 产品壳、API、共享契约、纯领域逻辑、AI 客户端和 UI 组件各自拥有清晰边界。

## 工作区结构

```text
typemaster/
|-- apps/
|   |-- web/               # Next.js + React 应用
|   `-- api/               # Hono API、静态服务和 Vercel 兼容入口
|-- packages/
|   |-- ai/                # AI 文本生成与教练反馈客户端
|   |-- config/            # 共享 Vitest/config 辅助
|   |-- contracts/         # Zod API 契约与存储/cache schema
|   |-- domain/            # 纯打字、训练、挑战和洞察规则
|   `-- ui/                # 共享 UI 原语
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- turbo.json
```

## 主要边界

- `apps/web/app`：Next.js App Router route tree 与根 layout
- `apps/web/src/application`：providers、query client、app shell 和导航适配
- `apps/web/src/screens`：home、practice、result、challenge、insights、diagnostic、training plan 页面
- `apps/web/src/features`：feature 自有 model、component、hook 和局部 UI state
- `apps/web/src/services/api`：浏览器侧 API gateway 与本地 API fallback cache
- `apps/web/src/services/storage`：浏览器 preferences 和 client cache repository
- `apps/web/src/store`：Zustand/React Query 桥接、持久化、薄 feature action 适配和可测试的产品 use case
- `apps/api/routes`：按 API 边界拆分的 Hono route
- `apps/api/services`：用户、会话、计划、画像、挑战和静态资源服务
- `apps/api/repositories`：服务层数据边界；优先使用 Postgres/Drizzle，未配置时回退到本地 JSON state
- `apps/api/infra`：Clerk 身份、Postgres/Drizzle、Upstash Redis 和 Inngest 适配器
- `apps/api/jobs`：Inngest 后台函数；处理教练反馈生成、画像重算和榜单缓存刷新
- `apps/api/state`：本地开发用 JSON state fallback 和 server-state use case
- `packages/contracts/src`：共享 storage key、API schema、server-state schema 和 OpenAPI 元信息
- `packages/domain/src`：无 React、无 IO 的纯规则和计算
- `packages/ai/src`：AI 请求客户端与 prompt 侧辅助
- `packages/ui/src`：可复用展示组件

## 环境要求

- Node.js `20.9+`
- pnpm `10+`

## AI 配置

AI 功能是可选的。内置文本和自定义文本训练不依赖 AI。

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

`NEXT_PUBLIC_TYPEMASTER_AI_PROXY=1` 只是前端功能开关，密钥只留在 API 侧。

Web AI 功能调用产品级 API route：`/api/practice-text` 生成练习文本，`/api/coach` 同步生成训练反馈；会话完成后的异步教练反馈会持久化到 `/api/coach-feedback`。Provider 细节留在 API 边界之后。

## 服务端基础设施配置

API 已预留生产基础设施边界；未设置这些变量时，本地开发会继续使用 JSON state 和本地开发 bearer token。

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

- API 身份入口统一走 `Authorization: Bearer <token>`；生产 token 由 Clerk 校验，本地未配置 Clerk 时使用 `typemaster-local:<userId>` 作为开发 token。
- Clerk identity 会通过 `apps/api/services/auth-service.ts` 映射到内部 account；Postgres 使用 `users.clerk_user_id`，本地 JSON fallback 使用扩展的 `authIdentity` 字段。
- 后端 user/session/plan/profile/challenge 服务统一通过 `apps/api/repositories/training-repository.ts` 访问数据；设置 `DATABASE_URL` 时使用 Postgres/Drizzle，否则使用 JSON state fallback。
- Postgres 表结构定义在 `apps/api/infra/db/schema.ts`，迁移入口为 `pnpm --filter @typemaster/api db:generate` 和 `pnpm --filter @typemaster/api db:push`。
- 每日挑战榜单缓存走 Upstash Redis adapter；会话完成、coach feedback、画像重算和榜单刷新事件走 Inngest adapter。Inngest worker 入口暴露在 `/api/inngest`；当前注册的后台函数会处理教练反馈生成、画像重算和挑战榜单刷新，本地调试可设置 `INNGEST_DEV=1`。
- 训练数据导出/导入走 `/api/exports`，使用 `TrainingDataBundle` v1 契约；服务端从 repository 组装 sessions、coach feedback、skill profile 和 training plan，不导出前端 store 快照。

## 本地开发

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

主要地址：

- Web：`http://localhost:5173`
- API：`http://localhost:8080`

开发时 Next.js rewrites 会把 Web 里的 `/api` 转发到 `http://localhost:8080`。

## 验证命令

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## 运行模型

- 路由使用 Next.js App Router 的 `/practice` 这类浏览器路径，不再使用 hash route。
- React Query 管理 account、sessions、plans、skill profiles、daily challenges 等 API 快照。
- Zustand 管理当前输入稿、运行时控制、UI 偏好和进行中的训练流等客户端交互状态。
- Store action hook 保持薄层适配；账号同步、稿件生成、训练流启动、教练反馈和会话完成等产品流程放在 `*-use-cases.ts` 模块中，并配有聚焦测试。
- 浏览器存储拆成 localStorage preferences 和 IndexedDB client cache。preferences 保存小型 UI 设置，client cache 保存最近会话、训练快照、恢复上下文和本地 API fallback 数据。
- 旧 localStorage cache key 不再作为数据来源；client cache hydrate 时会清理这些过时 key。
- `packages/contracts` 是 Web/API request 与 response shape 的共享契约来源。
- `packages/domain` 是打字、训练、挑战和洞察规则的唯一领域来源。
- 导出/导入数据包使用 `packages/contracts/storage` 中的 `TrainingDataBundle` v1，前端本地导入导出和 API `/api/exports` 共用同一版本化 shape。

## 建议阅读顺序

1. [`apps/web/app/layout.tsx`](./apps/web/app/layout.tsx)
2. [`apps/web/app/page.tsx`](./apps/web/app/page.tsx)
3. [`apps/web/src/store/app-state-bootstrap.tsx`](./apps/web/src/store/app-state-bootstrap.tsx)
4. [`apps/web/src/store/account-sync-use-cases.ts`](./apps/web/src/store/account-sync-use-cases.ts)
5. [`apps/web/src/store/session-completion-use-cases.ts`](./apps/web/src/store/session-completion-use-cases.ts)
6. [`apps/web/src/services/api/index.ts`](./apps/web/src/services/api/index.ts)
7. [`apps/api/app.ts`](./apps/api/app.ts)
8. [`apps/api/repositories/training-repository.ts`](./apps/api/repositories/training-repository.ts)
9. [`packages/contracts/src/api.js`](./packages/contracts/src/api.js)
10. [`packages/domain/src/index.js`](./packages/domain/src/index.js)
