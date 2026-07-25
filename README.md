[English](./README_EN.md) | 简体中文

# TypeRift 1.0

TypeRift 是一款以“输入词条即战斗”为核心的确定性打字 Roguelite。产品只有一条主线：首次校准 → 大厅 → 战局 → 三选一构筑 → 首领或撤离 → 复盘 → 弱键修复 → 下一轮解锁。

这是一次不兼容旧版本的全量重建。旧 TypeMaster / Typing Raid 页面、状态、契约、迁移、资产与浏览器数据不会被读取或转换；首次启动只会删除应用拥有的旧键和旧 IndexedDB。Clerk 外部身份仍可保留，但玩家档案从 v1 重新建立。

## 体验入口

- `/onboarding`：可跳过的首次节奏校准与 First Rift。
- `/`：单主操作的游戏大厅。
- `/play?mode=…`：`first-rift`、`expedition`、`daily-rift`、`repair-trial`、`quick-pulse`。
- `/missions`：每日与每周任务。
- `/archive`：战局、图鉴、成就和洞察。
- `/debrief/[runId]`：战绩、构筑、任务、教练建议与下一步。

## 工作区

```text
apps/
  web/        Next.js App Router、Canvas/DOM 战场、React Query、Zustand、IndexedDB
  api/        Hono、Clerk、Postgres、Upstash、Inngest、Vercel handler
packages/
  domain/     无 React/浏览器/时间/网络依赖的确定性游戏、成长、任务、洞察
  contracts/  严格 Zod v1 契约
  ui/         无业务状态的可访问 UI 原语
  ai/         只接收聚合指标的可选教练润色边界
  config/     共享测试配置
docs/
  art-direction.md
  architecture.md
  game-design.md
  operations.md
```

## 本地开发

要求 Node.js 20.9+ 与 pnpm 10。

```bash
pnpm install
pnpm dev
```

- Web：`http://localhost:5173`
- API：`http://localhost:8080`

未配置基础设施时，开发和测试环境使用 `.data/typerift-v1.json`；生产环境缺少 `DATABASE_URL` 会直接启动失败。

## 质量门槛

```bash
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm audit:tokens
pnpm build
pnpm test:e2e
```

领域与契约采用严格 TypeScript，公开战局类型为 `RunState`、`RunCommand`、`RunEvent`、`RunSnapshot`、`RunResult` 与 `ReplayLog`。Daily Rift 由服务端以固定种子重放命令日志并校验结果哈希；普通离线战局使用客户端 run ID 幂等同步。

## 资产

`apps/web/public/game/v1` 包含 3 张区域背景、9 个敌人、3 个首领、24 个升级图标与程序化原创音效。`manifest.json` 记录尺寸、SHA-256、色域和无障碍标签键。源资产处理脚本位于 `scripts/process-generated-assets.py` 与 `scripts/generate-audio-assets.py`。

## 环境变量

生产必需：

```bash
DATABASE_URL=postgres://...
RUN_SIGNING_SECRET=...
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

可选增强：

```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
AI_COACH_ENABLED=true
AI_API_URL=https://...
AI_API_KEY=...
SENTRY_DSN=https://...
WEB_ORIGINS=https://example.com
```

AI 未配置时，本地确定性复盘、任务和所有核心玩法保持完整。AI 边界不会接收自由输入文本或完整按键历史。

设计、架构、玩法与运维说明见 [docs](./docs/architecture.md)。
