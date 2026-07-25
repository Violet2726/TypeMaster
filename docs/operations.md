# TypeRift v1 运维手册

## 发布前

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm audit:tokens
pnpm build
pnpm test:e2e
```

CI 必须先通过严格类型、单测、覆盖率、token 审计和生产构建，再执行桌面/移动 E2E、axe 与稳定 seed 视觉回归。任何门槛失败都停止发布。

## Vercel

根 `vercel.json` 同时构建 Hono handler 和 Next 应用，`/api/*` 路由必须位于 Web 通配路由之前。生产环境至少配置 `DATABASE_URL`、`RUN_SIGNING_SECRET`、Clerk 密钥与 `WEB_ORIGINS`。缺少 Postgres 时 `createStateStore` 会抛错，禁止退回 JSON。

首次部署前执行唯一的 `0000_initial.sql`。不要运行旧迁移，不要从旧表复制数据。

## 监控

- 所有 API 日志包含 `requestId`、method、path、status 与 durationMs。
- 重点告警：5xx、Daily 重放失败突增、限流命中异常、Postgres 连接失败、Inngest 教练任务失败。
- 可选 Sentry 接口只上报错误和请求元数据，禁止附带原始输入或命令日志。
- Upstash 故障只影响排行榜缓存，不影响战局结算。
- AI/Inngest 故障只保留本地教练报告，不影响游戏主线。

## 性能预算

- 大厅 LCP < 2.5s、INP < 200ms、CLS < 0.1。
- 桌面战场 P95 帧时间 < 20ms，目标 60fps。
- `/play` 之外不得预载战场位图。
- 资源 manifest 变化必须同步更新内容版本或明确验证兼容性；v1 当前选择直接切换而不是兼容旧内容。

## 回滚

代码回滚以 Git/Vercel 版本为单位；数据库 schema 只有 v1 初始结构。不要通过恢复旧 TypeMaster 表或客户端键“修复”故障。若内容发布本身有问题，回滚完整应用版本并保持 `contentVersion` 与资产 manifest 一致。
