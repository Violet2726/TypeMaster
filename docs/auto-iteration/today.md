# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: ✅ 已完成

## 1. 今日主线
把挑战趋势结论继续前置到首页，让用户在首页就知道“现在是否值得再来一轮”。

## 2. 问题背景
上一轮已经做出挑战趋势图，但用户仍然需要点进 ChallengePage 才知道今天更适合继续冲榜还是先稳节奏。首页挑战卡还缺少真正的“下一步建议”。

## 3. 根因判断
- 首页挑战卡虽然有名次和最佳信息，但没有动作建议
- 挑战趋势状态还停留在 ChallengePage 内部，没有前置到入口层
- 当前缺少“继续冲榜 / 先稳准确率 / 继续扩大样本”这类明确决策语言

## 4. 目标用户价值
让用户不进挑战页也能从首页直接知道今天的挑战状态和下一步建议，降低决策成本，提升回访后的启动速度。

## 5. 工程价值
把趋势状态抽成可复用 helper，让首页建议、挑战页趋势图和后续教练结论共享同一套规则。

## 6. 涉及模块
- src/pages/HomePage.jsx → 首页挑战卡新增“下一步建议” ✅
- src/engine/challenge.js → 新增 challenge trend state helper ✅
- src/engine/__tests__/challenge.test.js → 新增趋势状态测试 ✅
- src/training/copy.js → 新增建议化文案 ✅
- index.css → 新增首页建议区样式 ✅
- src/pages/__tests__/HomePage.test.jsx → 覆盖建议化提示 ✅
- e2e/app.spec.js → 覆盖首页建议提示路径 ✅

## 7. 非目标
- 今日不新增新的挑战模式
- 不做跨天建议逻辑
- 不改 challenge API 协议

## 8. 设计方案
1. 基于今日 challenge trend state 推导首页建议
2. 建议状态分为：`idle / warm / improving / cooling / steady`
3. 首页挑战卡直接展示“下一步建议”文案
4. 保持建议口径与 ChallengePage 趋势图一致

## 9. 验收标准
- [x] 首页挑战卡可见明确的下一步建议
- [x] 建议会随今日挑战状态变化
- [x] 单测与 e2e 覆盖建议提示路径
- [x] 构建与全量测试通过

## 10. 质量门禁
- [x] npm run build ✅
- [x] npm test ✅ (248 passed)
- [x] npm run test:e2e ✅ (8 passed, 4 skipped)

## 11. 回滚策略
若首页建议造成认知噪音，优先回退 HomePage 中的建议区和趋势状态文案，不动已有挑战趋势图与历史回放。

## 12. 下一轮候选
- ChallengePage 趋势图增加更细的焦点态说明
- 首页挑战卡加入“推荐何时停止继续冲榜”的边界提示
- 继续拆分 practice-store，减少挑战与计划状态耦合
