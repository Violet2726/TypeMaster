# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: 已完成

## 1. 今日主线
把首页挑战卡的“下一步建议”策略文案接入共享挑战策略模型。首页不再维护 `challengeStrategyState -> strategy* copy` 的本地映射，而是消费 `buildChallengeStrategyModel` 输出的 `note`、`primaryAction` 和 `primaryLabel`，让首页挑战建议从“页面拼装”进一步升级为“训练层产品模型”。

## 2. 问题背景
上一轮已经把首页主 CTA 接入共享动作模型，但策略说明文案仍留在 HomePage。结果是首页的动作来自共享模型，说明文案却仍由页面自己判断；短期可用，长期会让“什么状态该怎么解释”继续散落在页面层。

## 3. 根因判断
- `HomePage` 仍维护 `challengeStrategyText` 本地映射
- training 层只覆盖 challenge focus note，还没有覆盖首页 strategy note
- 策略状态 `idle / warm / push / cooling / recover / steady` 的语义没有被模型测试保护
- 如果未来新增移动端入口或教练卡，策略文案很容易再次复制一份

## 4. 目标用户价值
首页挑战卡会更像一个一致的训练教练：建议文案和按钮动作由同一套模型生成，不会出现“文案建议恢复、按钮却继续冲榜”这类分裂体验。用户扫一眼就能理解当前该冲、该稳，还是该回主线训练。

## 5. 工程价值
新增 `buildChallengeStrategyModel` 和 `getChallengeStrategyNote`，把首页策略文案映射沉淀到 training 层。页面只负责展示和执行模型输出，后续如果要把挑战教练扩展到更多入口，可以复用同一份策略语义和动作定义。

## 6. 涉及模块
- `src/training/challenge-focus.js`：新增策略文案键映射、`getChallengeStrategyNote` 和 `buildChallengeStrategyModel`
- `src/training/__tests__/challenge-focus.test.js`：补充 strategy state 文案映射和策略模型动作覆盖
- `src/pages/HomePage.jsx`：移除页面本地 `challengeStrategyText`，改为消费共享 strategy model
- `docs/auto-iteration/today.md`：记录本轮需求、设计和验收
- `docs/auto-iteration/release-notes.md`：追加发布记录
- `docs/auto-iteration/decision-log.md`：追加决策记录

## 7. 非目标
- 不改变挑战策略阈值
- 不改变首页视觉布局
- 不新增新的用户可见文案
- 不重命名 `challenge-focus.js`
- 不新增 e2e 用例数量

## 8. 设计方案
1. 用 `STRATEGY_NOTE_KEYS` 统一维护首页策略状态到训练文案 key 的映射
2. `getChallengeStrategyNote(trainingCopy, state)` 返回对应策略说明，未知状态回落到 steady 文案
3. `buildChallengeStrategyModel(trainingCopy, state, options)` 组合策略说明和共享 action model
4. `recover` 策略状态自动传入 `shouldRecover: true`，保持恢复动作优先级
5. HomePage 通过 `challengeStrategyModel.note` 展示策略说明
6. HomePage 通过 `challengeStrategyModel.primaryAction` 执行挑战、计划或自由热身
7. HomePage 通过 `challengeStrategyModel.primaryLabel` 展示 CTA，不再自己拼标签

## 9. 验收标准
- [x] 首页策略说明仍覆盖 idle、warm、push、cooling、recover、steady 状态
- [x] `push` 和 `improving` 都映射到 improvement 策略文案
- [x] 未知策略状态回落到 steady 文案
- [x] 恢复状态继续优先输出回计划动作
- [x] 首页 CTA 行为保持不变
- [x] 构建、全量单测、e2e 通过

## 10. 质量门禁
- [x] `npm test -- --run src/training/__tests__/challenge-focus.test.js` 通过，9 tests passed
- [x] `npm test -- --run src/pages/__tests__/HomePage.test.jsx` 通过，2 tests passed
- [x] `npm test` 通过，261 tests passed
- [x] `npm run build` 通过
- [x] `npm run test:e2e` 通过，9 passed, 5 skipped
- [x] `git diff --check` 通过；仅有仓库 CRLF 提示
- [x] 已检查 in-app browser；当前会话没有可用浏览器实例，已由 Playwright e2e 覆盖核心路径

## 11. 回滚策略
如果首页挑战策略展示异常，可回滚 HomePage 对 `buildChallengeStrategyModel` 的接入，临时恢复本地 `challengeStrategyText` 映射；共享 strategy helper 可保留在 training 层，等待下一轮修正后再接回首页。

## 12. 下一轮候选
- 为结果页风险状态补一条 e2e 场景，覆盖从风险挑战回计划的完整 UI 路径
- 清理 release notes 顶部重复的迭代 10 记录
- 如果挑战模型继续增长，再考虑把 `challenge-focus.js` 重命名为更宽的 challenge coach model
