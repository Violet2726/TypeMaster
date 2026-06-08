# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: ✅ 已完成

## 1. 今日主线
把 ChallengePage 的挑战表现从“列表”升级成“趋势图”，让用户更直观看见今天是越打越好还是开始回落。

## 2. 问题背景
上一轮已经能看到今日挑战历史列表，但仍需要靠读数字理解表现变化。用户很难一眼判断今天几次挑战是持续进步、开始回落，还是整体稳定。

## 3. 根因判断
- ChallengePage 没有可视化趋势反馈
- 只有表格记录，缺少“首次 vs 最新”的差异表达
- 现有 helper 已支持历史数据，但还没有聚合成趋势模型

## 4. 目标用户价值
让用户打开 ChallengePage 时，一眼看出今天几次挑战是提速了、掉速了，还是整体平稳，从而更快决定是否继续挑战。

## 5. 工程价值
把 challenge helper 从“记录过滤”扩展到“趋势建模”，让图表、首页结论和后续建议都能复用同一套数据基础。

## 6. 涉及模块
- src/components/ChallengeTrendChart.jsx → 新增挑战趋势图组件 ✅
- src/pages/ChallengePage.jsx → 接入趋势图并保留回放列表 ✅
- src/engine/challenge.js → 新增 challenge trend 建模 helper ✅
- src/engine/__tests__/challenge.test.js → 新增趋势 helper 测试 ✅
- src/training/copy.js → 新增趋势图文案 ✅
- src/pages/__tests__/ChallengePage.test.jsx → 覆盖趋势图渲染 ✅
- e2e/app.spec.js → 覆盖 ChallengePage 趋势图路径 ✅

## 7. 非目标
- 今日不做跨天趋势
- 不做更复杂的交互式拖拽图表
- 不改 challenge API 协议

## 8. 设计方案
1. 新增今日挑战趋势图，展示 WPM 与准确率两条曲线
2. 趋势图摘要直接展示首次、最新、速度变化、准确率变化
3. 根据今日变化自动给出“继续提速 / 先稳节奏 / 整体平稳”的趋势结论
4. 当前趋势只基于今日当前 challengeId 的记录

## 9. 验收标准
- [x] ChallengePage 可见今日挑战趋势图
- [x] 趋势图可见速度与准确率变化摘要
- [x] 单测与 e2e 覆盖趋势图路径
- [x] 构建与全量测试通过

## 10. 质量门禁
- [x] npm run build ✅
- [x] npm test ✅ (247 passed)
- [x] npm run test:e2e ✅ (8 passed, 4 skipped)

## 11. 回滚策略
若趋势图表达引发理解成本，优先回退 ChallengeTrendChart 与 ChallengePage 中的趋势接入，不动已有历史列表与榜单逻辑。

## 12. 下一轮候选
- 首页挑战卡加入“是否值得再来一轮”的建议化提示
- ChallengePage 趋势图增加更细的焦点态说明
- 继续拆分 practice-store，减少挑战与计划状态耦合
