# TypeMaster Studio

TypeMaster Studio 是一间安静、以文字为中心的打字练习空间。选择一段原创英文短文，按自己的节奏练习；速度、准确率和需要回看的按键会在本机记录。没有账号、排行榜或游戏奖励。

界面默认简体中文，支持英文、系统明暗主题、文字放大、增强对比度和减少动态效果。Mac、iPad 和 iPhone 使用同一套练习流程与设备键盘。

## 本地开发

要求 Node.js 20.9+ 与 pnpm 10。

```bash
pnpm install
pnpm dev
```

网页地址：`http://localhost:5173`

```bash
pnpm check       # format, lint, types, tests, design tokens, static build
pnpm test:e2e    # desktop, tablet, phone and visual flows
```

## 工作区

- `apps/web`：Next.js App Router 前端与静态导出。
- `packages/domain`：确定性的练习状态机和原创短文内容，不依赖 React、浏览器或网络。
- `packages/config`：共享 Vitest 配置。

生产构建输出到 `apps/web/out`。新版练习不请求 API，不需要账号、数据库或运行时服务。

## 本地记录

偏好和最近 20 次练习保存在当前浏览器的 `typemaster-studio:v1:*` 命名空间。首次启动只清理明确列出的 TypeMaster 旧版、Typing Raid、TypeRift 和 Pulsefield 存储；不会清理同源下其他应用的数据，也不会迁移旧进度。若旧 IndexedDB 仍被其他标签页占用，可以关闭旧页面后重试。

竞品观察与设计取舍见 [产品设计说明](./docs/product-design.md)。TypeRift 旧线上数据的待办状态见 [退役说明](./docs/data-retirement.md)。
