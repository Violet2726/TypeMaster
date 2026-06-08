# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: 已完成

## 1. 今日主线
把 ChallengePage 的“今日挑战趋势”从数值回放升级为可行动的单次教练判断。用户点选某一次挑战时，不只看到 WPM 和准确率变化，还能看到这次表现适合继续冲榜、稳住节奏、保护准确率，还是需要警惕回落。

## 2. 问题背景
上一轮已经补上首页的挑战边界建议，避免用户在明显回落时继续无效冲榜。但 ChallengePage 的趋势图仍偏“数据展示”：用户能看到某次比上次快了多少、准了多少，却还要自己翻译成下一步动作。

## 3. 根因判断
- 趋势图已有点选能力，但焦点态只展示原始指标
- 首页已有策略建议，挑战页缺少同等粒度的“本次解释”
- 单次挑战回放没有把速度变化和准确率风险合并成清晰判断

## 4. 目标用户价值
用户复盘今日挑战时，可以直接理解每一次尝试的意义：哪一次是真正突破，哪一次是靠牺牲准确率换速度，哪一次已经开始掉速。这样挑战页会更像训练教练，而不是只像排行榜附属页。

## 5. 工程价值
把单次焦点判断抽到 `src/engine/challenge.js`，让组件展示和测试都依赖同一套规则，后续可以继续复用到首页、结果页或更完整的教练系统。

## 6. 涉及模块
- `src/engine/challenge.js`：新增 `getChallengePointFocusState`
- `src/components/ChallengeTrendChart.jsx`：焦点面板展示本次教练判断
- `src/training/copy.js`：新增中英文焦点判断文案
- `index.css`：新增焦点判断视觉状态
- `src/engine/__tests__/challenge.test.js`：覆盖单次焦点状态判断
- `src/pages/__tests__/ChallengePage.test.jsx`：覆盖挑战页可见教练判断

## 7. 非目标
- 不新增新的挑战模式
- 不改变排行榜排序规则
- 不改变云端 challenge API
- 不做跨天趋势分析

## 8. 设计方案
1. 第一次挑战作为今日基线，不做过度判断
2. 后续挑战按相对上次的 WPM 和准确率变化归类
3. 明显提速且准确率未明显掉落时标记为 breakthrough
4. 准确率明显下滑优先提示 accuracy-risk
5. 速度明显回落提示 speed-drop
6. 小幅波动提示 stable，复杂波动提示 mixed
7. ChallengeTrendChart 默认聚焦最新一次挑战，直接展示对应教练文案

## 9. 验收标准
- [x] 趋势图点选某次挑战时展示可行动的教练判断
- [x] 最新一次挑战默认显示焦点说明
- [x] 引擎 helper 覆盖 baseline / breakthrough / accuracy-risk / speed-drop / stable / mixed
- [x] 页面测试能验证 ChallengePage 出现焦点判断文案
- [x] 构建、全量单测、e2e 通过

## 10. 质量门禁
- [x] `npm test` 通过，251 tests passed
- [x] `npm run build` 通过
- [x] `npm run test:e2e` 通过，9 passed, 5 skipped
- [x] 本轮尝试 in-app browser 加载检查，但当前会话没有可用浏览器实例；已由 Playwright e2e 覆盖核心用户路径

## 11. 回滚策略
如果焦点判断文案过于主观，可以先回滚 `ChallengeTrendChart` 的展示和文案，保留 `getChallengePointFocusState` helper 作为后续策略实验入口。

## 12. 下一轮候选
- 把单次焦点判断同步到结果页，让刚完成挑战的用户立刻看到本次意义
- 修复 release notes 顶部重复的迭代 10 记录
- 继续拆分 `practice-store`，减少挑战、计划、云同步之间的状态耦合
