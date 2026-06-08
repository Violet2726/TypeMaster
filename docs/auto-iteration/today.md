# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: 已完成

## 1. 今日主线
把挑战单次教练判断前置到 ResultPage。用户刚完成每日挑战后，不必先跳到 ChallengePage 才能理解这轮表现，结果页会直接告诉他这次是提速突破、准确率风险、速度回落、稳定还是混合变化。

## 2. 问题背景
上一轮已经让 ChallengePage 趋势图支持单次细看，但用户完成挑战后的第一触点其实是 ResultPage。此时页面已有榜单战绩卡，不过它主要围绕排名同步；当榜单还在刷新或用户只想快速复盘时，缺少“这轮本身说明什么”的即时反馈。

## 3. 根因判断
- 单次焦点判断规则已经存在，但只在 ChallengePage 使用
- ResultPage 的挑战卡偏榜单结果，没有承接本地挑战趋势解释
- 用户刚完成一轮时最需要即时反馈，而不是等待榜单或再点进挑战页

## 4. 目标用户价值
挑战结束后，用户能立刻知道下一轮该怎么做：继续保持压力、稍微放慢保护准确率，还是注意速度回落。这让结果页更像训练闭环的终点，而不是只展示分数。

## 5. 工程价值
复用 `getChallengePointFocusState` 和当日挑战 session helper，不新增规则分叉。结果页、挑战页共享同一套单次焦点判断，后续可以继续沉淀成统一的挑战教练模型。

## 6. 涉及模块
- `src/pages/ResultPage.jsx`：挑战战绩卡新增即时 Run focus 判断
- `index.css`：新增结果页挑战焦点块样式
- `src/pages/__tests__/ResultPage.test.jsx`：覆盖结果页显示单次教练判断和相对上次变化
- `docs/auto-iteration/today.md`：记录本轮需求、设计和验收
- `docs/auto-iteration/release-notes.md`：追加发布记录
- `docs/auto-iteration/decision-log.md`：追加决策记录

## 7. 非目标
- 不改变榜单同步逻辑
- 不改变 challenge API
- 不新增结果页跳转路径
- 不做跨天挑战解释

## 8. 设计方案
1. ResultPage 识别当前 session 是否为 challenge
2. 从本地 sessions 中取同一 challengeId 的今日挑战历史
3. 用 `buildChallengeTrend` 找到当前 session 对应的趋势点
4. 用 `getChallengePointFocusState` 得到焦点状态
5. 在挑战战绩卡顶部展示 Run focus 文案
6. 如果存在上一轮样本，同步显示 WPM / accuracy 的相对变化
7. 榜单名次同步、pending、error 状态保持原逻辑

## 9. 验收标准
- [x] 挑战结果页可见 Run focus / 本次细看
- [x] 当前挑战相对上次提速且准确率稳定时，显示突破型文案
- [x] 当前挑战有上一轮样本时，结果页显示相对上次 WPM / accuracy 变化
- [x] 原有挑战榜单战绩卡仍正常显示排名和查看榜单入口
- [x] 构建、全量单测、e2e 通过

## 10. 质量门禁
- [x] `npm test` 通过，251 tests passed
- [x] `npm run build` 通过
- [x] `npm run test:e2e` 通过，9 passed, 5 skipped
- [x] 已尝试 in-app browser 检查；当前会话没有可用浏览器实例，已由 Playwright e2e 覆盖核心用户路径

## 11. 回滚策略
如果结果页信息密度过高，可回滚 ResultPage 中的 `result-challenge-focus` 展示块和样式，不影响 ChallengePage 已有趋势图与榜单逻辑。

## 12. 下一轮候选
- 清理 release notes 顶部重复的迭代 10 记录
- 抽出共享的 challenge focus 文案映射，减少 ResultPage 与 ChallengeTrendChart 的重复
- 继续拆分 `practice-store`，减少挑战、计划、云同步状态耦合
