# TypeRift v1 架构

## 边界

```text
Next.js routes
  ├─ React Query ─────── Hono /api ─────── StateStore
  │                                        ├─ Postgres (production)
  │                                        └─ JSON (dev/test only)
  ├─ Zustand (ephemeral UI/settings sheet)
  ├─ IndexedDB (guest runs + sync outbox)
  └─ Canvas renderer ← RunState → accessible DOM targets/HUD

packages/domain: game | progression | missions | insights
packages/contracts: strict Zod v1 schemas
packages/ai: aggregate-only coach boundary
```

领域包不得依赖 React、浏览器、时间或网络。服务端快照由 React Query 管理；Zustand 不保存长期业务数据。IndexedDB 使用 `typerift-v1`，localStorage 使用 `typerift:v1:*`。

## API

- `GET /api/me`
- `GET/PATCH /api/player`
- `POST /api/runs/start`
- `POST /api/runs/:id/complete`
- `GET /api/runs`
- `GET /api/missions`
- `GET /api/leaderboards/daily`
- `GET /api/coach-reports/:runId`
- `GET /api/export`
- `POST /api/import`

请求体上限为 1 MiB。每个响应包含请求 ID；服务端输出结构化 JSON 日志，并按来源执行进程内保护性限流。Upstash 只缓存从已验证 runs 派生的 Daily 排行榜。

## 数据库

唯一初始迁移为 `apps/api/drizzle/0000_initial.sql`。表仅为：

- `players`
- `player_progress`
- `runs`
- `mission_progress`
- `coach_reports`

没有旧数据迁移、兼容视图或双写路径。导入只接受 `format: typerift-export`、`version: 1` 的严格 bundle。

## 隐私

Clerk 负责外部身份。游戏只保存战局聚合结果与命令日志提交；AI 只接收模式、难度、分数、准确率、WPM、连击、时长、击杀、首领和弱字符 key，不接收自由输入文本或完整按键历史。AI 不可用时本地复盘能力不降级。
