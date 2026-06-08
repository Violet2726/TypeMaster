# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: ✅ 已完成

## 1. 今日主线
把挑战趋势做成“能解释每一次变化”的体验：首页直接给建议，ChallengePage 能细看单次表现相对上一次的变化。

## 2. 问题背景
上一轮已经把挑战趋势做成图表，但用户仍然很难回答两个问题：1）在首页到底值不值得继续冲榜；2）ChallengePage 上某一次挑战相对上一次具体发生了什么变化。

## 3. 根因判断
- 首页挑战卡缺少明确的“下一步建议”
- 趋势图只有总览，没有单次焦点态解释
- 用户看见曲线后仍然要自己解读“为什么这次更适合继续冲/先稳住”

## 4. 目标用户价值
让用户在首页立即得到行动建议；进入 ChallengePage 后还能选中某次挑战，理解它相对上一次是进步还是回落，降低理解成本和决策成本。

## 5. 工程价值
让首页建议、趋势图总览、趋势图焦点态都复用同一套 challenge trend state 与 trend point 数据，减少页面间逻辑分叉。

## 6. 涉及模块
- src/pages/HomePage.jsx → 首页挑战卡新增挑战建议提示 ✅
- src/components/ChallengeTrendChart.jsx → 新增趋势焦点卡片与切换交互 ✅
- src/engine/challenge.js → 扩展 trend point / trend state helper ✅
- src/engine/__tests__/challenge.test.js → 扩展趋势 helper 测试 ✅
- src/training/copy.js → 新增建议与焦点态文案 ✅
- index.css → 复用既有 replay inspect 样式，无额外大改 ✅
- src/pages/__tests__/HomePage.test.jsx / ChallengePage.test.jsx → 覆盖建议与焦点态 ✅
- e2e/app.spec.js → 覆盖首页建议提示与 ChallengePage 新结构 ✅

## 7. 非目标
- 今日不做跨天趋势分析
- 不做复杂拖拽或 hover 交互图表
- 不改 challenge API 协议

## 8. 设计方案
1. 基于 challenge trend state 推导首页建议
2. 趋势图新增可切换的 run focus 卡片，显示某次挑战的 WPM、准确率、相对上次变化
3. 焦点态默认选中最新一次，兼顾最新反馈和可读性
4. 首页建议与 ChallengePage 趋势结论保持同一口径

## 9. 验收标准
- [x] 首页挑战卡可见明确的下一步建议
- [x] ChallengePage 趋势图可见 Run focus 细看卡片
- [x] 细看卡片展示相对上一次的变化
- [x] 单测与 e2e 覆盖新增体验
- [x] 构建与全量测试通过

## 10. 质量门禁
- [x] npm run build ✅
- [x] npm test ✅ (248 passed)
- [x] npm run test:e2e ✅ (8 passed, 4 skipped)

## 11. 回滚策略
若焦点态解释造成复杂度上升，优先回退 ChallengeTrendChart 的 run focus 卡片和首页建议文案，不动已有趋势图与历史回放。

## 12. 下一轮候选
- 首页挑战卡加入“推荐何时停止继续冲榜”的边界提示
- ChallengePage 趋势图加入更强的状态切换动效
- 继续拆分 practice-store，减少挑战与计划状态耦合
