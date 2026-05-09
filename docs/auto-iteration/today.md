# 今日自治迭代计划

## 1. 今日主线

为 `useTypingSession` 核心 Hook 建立自动化测试基线（目标 20-30 个测试用例覆盖核心时序逻辑）。

## 2. 问题背景

当前项目已建立 Vitest 测试基线，覆盖 `engine/` 模块（metrics/coach/insights）共 56 个测试。但 `src/hooks/useTypingSession.jsx`（507 行）是打字训练核心时序逻辑，包含状态机、计时器、输入处理、打字历史追踪等复杂逻辑，**完全没有任何测试覆盖**。

这意味着：
- 未来任何对 `useTypingSession` 的重构都无法安全进行
- 打字状态机的边界情况（如暂停恢复、时间模式结束、Backspace 边界等）没有回归保护
- 自治迭代的自动化质量门禁不完整

## 3. 根因判断

**测试缺口**：核心 Hook 缺乏测试覆盖，不是架构问题，不是状态混乱，而是测试体系不完整。

## 4. 目标用户价值

间接但重要：
- 未来能更安全地迭代打字体验
- 减少因代码变更引入的回归 bug
- 提升产品质量信心

## 5. 工程价值

- 建立 React Hook 测试模式（使用 React Testing Library 或直接测试 hook 逻辑）
- 为 `useTypingSession` 未来重构奠定基础
- 完善自动化质量门禁的最后一块短板
- 提升自治迭代的可靠性

## 6. 涉及模块

| 目录/文件 | 操作 |
|-----------|------|
| `src/hooks/__tests__/useTypingSession.test.jsx` | 新建 |
| `src/hooks/useTypingSession.jsx` | 分析测试点 |
| `vitest.config.js` | 确认配置（node 环境） |

## 7. 非目标

- 不修改 `useTypingSession` 源代码
- 不测试 UI 组件（TypingArea 等）
- 不添加覆盖率报告集成（后续单独任务）
- 不测试 integration/e2e 层面

## 8. 设计方案

### 8.1 测试策略

由于 `useTypingSession` 是 React Hook，直接单元测试需要 DOM 环境或抽取纯函数。当前项目使用 node 测试环境，因此采用以下策略：

**方案 A（推荐）**：抽取 hook 中的纯函数逻辑到 `src/engine/` 进行测试
- 将 `commitCurrentWord`、`startSession`、`pauseSession`、`resumeSession`、`finishSession` 等纯逻辑抽取为可测试函数
- Hook 本身只负责 React 生命周期和状态编排

**方案 B**：测试 hook 返回值和行为（需要 jsdom 环境）
- 如果方案 A 工作量过大，可以引入 jsdom 环境专门测试 hooks

**采用方案 A**，因为：
1. 保持 node 测试环境一致性
2. 强制提取纯函数，提升代码质量
3. 与现有 engine 模块结构一致

### 8.2 测试用例规划

#### Phase 1: 状态机测试（8-10 个）
- idle 状态初始值验证
- idle → running 转换（收到输入时自动开始）
- running → paused 转换（blur/pauseSession）
- paused → running 转换（focus/resumeSession）
- running → complete 转换（打完所有词/时间到）
- Backspace 在边界情况处理

#### Phase 2: 指标计算测试（6-8 个）
- liveMetrics 在 idle 状态返回正确初始值
- 正确计算 WPM（基于 elapsedMs 和正确字符）
- 正确计算准确率
- 一致性计算

#### Phase 3: 边界情况测试（6-8 个）
- 空 draft 处理
- 单字符词处理
- 时间模式时间到自动结束
- 词数模式打完最后一个词结束
- pause/resume 正确计算暂停时长

#### Phase 4: Timeline 采样测试（4-6 个）
- 每秒采样点生成
- timeline 数据结构完整性
- finishSession 时 timeline 包含所有数据

### 8.3 提取纯函数的初步方案

```javascript
// src/engine/session-machine.js (新文件)

export function computeNextWordState(currentInput, currentWordIndex, words, typedHistory) {
  if (!currentInput || currentWordIndex >= words.length) {
    return null;
  }
  return {
    nextHistory: [...typedHistory, currentInput],
    nextWordIndex: currentWordIndex + 1
  };
}

export function computeElapsedMs(startedAt, completedAt, pausedAt, pausedDurationMs, status, nowMs) {
  if (!startedAt) return 0;
  const endReference = status === 'complete'
    ? (completedAt || nowMs)
    : status === 'paused'
      ? (pausedAt || nowMs)
      : nowMs;
  return Math.max(0, endReference - startedAt - pausedDurationMs);
}

export function isSessionComplete(config, currentWordIndex, words, elapsedMs) {
  if (config.mode === 'time') {
    return elapsedMs >= config.durationSeconds * 1000;
  }
  return currentWordIndex >= words.length;
}

// ... 更多纯函数
```

## 9. 验收标准

### 9.1 必须通过
- `npm run build` 通过（不破坏构建）
- `npm test` 通过（所有现有 56 个测试 + 新测试）
- 新增测试覆盖 useTypingSession 核心逻辑
- 新测试位于 `src/hooks/__tests__/` 目录
- 提取的纯函数位于 `src/engine/` 目录

### 9.2 质量标准
- 新增 20-30 个测试用例
- 测试覆盖：
  - 状态机转换（idle/running/paused/complete）
  - 指标计算（WPM、准确率、一致性）
  - 边界情况（空 draft、单字符词、时间/词数模式）
  - Timeline 采样逻辑

## 10. 质量门禁

```bash
npm run build          # 必须通过
npm test               # 必须通过，所有测试 green
```

## 11. 回滚策略

如果失败：
```bash
git reset --hard ORIG_HEAD   # 回滚到上一个 main
```
然后将失败记录写入 `failure-log.md`。

## 12. 自动合并条件

### 必须满足
- ✅ `npm run build` 通过
- ✅ `npm test` 通过（所有测试 green）
- ✅ 新测试文件存在且非空
- ✅ 没有破坏现有功能

### 如果失败
- 回滚到上一个 main commit
- 写入 `failure-log.md`
- 取消合并

### 允许自动修复后合并
- 测试文件语法错误（修复后重跑）
- import 路径问题（修复后重跑）

---

**计划制定时间**: 2026-05-09 04:30 UTC
**计划执行时间**: 2026-05-09 白天 CI 自动触发
