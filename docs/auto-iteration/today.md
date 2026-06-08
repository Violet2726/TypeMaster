# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: 已完成

## 1. 今日主线
把挑战单次焦点沉淀成共享产品模型。ResultPage 和 ChallengeTrendChart 不再各自维护“状态到文案”的映射，结果页的主动作也直接读取模型给出的 `primaryAction`，避免未来继续扩展挑战教练时出现分叉。

## 2. 问题背景
前几轮已经连续增强了挑战反馈：趋势图能解释单次表现，结果页也能给出下一步动作。但这些能力仍散在组件里，尤其是 focus 文案和恢复状态判断同时出现在不同页面。功能变强之后，如果规则没有收束，后续每加一个入口都可能多出一份隐形维护成本。

## 3. 根因判断
- `ChallengeTrendChart` 和 `ResultPage` 各自维护 focus state 到文案的映射
- ResultPage 自己判断风险状态并决定 CTA，页面层承担了产品规则
- Vitest 之前没有覆盖 `src/training` 下的产品文案模型

## 4. 目标用户价值
用户可见体验保持稳定，但产品判断更一致：无论在挑战页还是结果页，`accuracy-risk`、`speed-drop`、`breakthrough` 等状态都会走同一套解释与动作模型。后续新增首页提示、移动端引导或更完整教练卡时，不需要重新发明一遍规则。

## 5. 工程价值
新增 `src/training/challenge-focus.js` 作为挑战焦点的共享模型，集中处理文案、恢复状态、主动作和主按钮标签。组件只负责展示与执行，减少重复分支，也让产品规则可以被纯函数测试保护。

## 6. 涉及模块
- `src/training/challenge-focus.js`：新增挑战焦点共享模型
- `src/training/__tests__/challenge-focus.test.js`：覆盖文案映射、恢复状态和 CTA 模型
- `src/components/ChallengeTrendChart.jsx`：改为复用共享 focus note
- `src/pages/ResultPage.jsx`：改为复用共享 focus model 和 `primaryAction`
- `vitest.config.js`：纳入 `src/training/__tests__`
- `docs/auto-iteration/today.md`：记录本轮需求、设计和验收
- `docs/auto-iteration/release-notes.md`：追加发布记录
- `docs/auto-iteration/decision-log.md`：追加决策记录

## 7. 非目标
- 不改变挑战焦点判断阈值
- 不改变用户可见文案
- 不改变结果页 CTA 行为
- 不新增 e2e 场景

## 8. 设计方案
1. 新增 `getChallengeFocusNote(trainingCopy, state)` 统一 focus 文案映射
2. 新增 `isChallengeFocusRecoveryState(state)` 统一恢复状态判断
3. 新增 `buildChallengeFocusModel(trainingCopy, state, options)` 输出 `note`、`shouldRecover`、`primaryAction`、`primaryLabel`
4. ChallengeTrendChart 移除本地 `getPointFocusNote`
5. ResultPage 移除本地 `getChallengeFocusNote` 和页面内恢复 CTA 判断
6. ResultPage 的按钮点击逻辑改为执行 `primaryAction: challenge | plan | free`
7. Vitest 配置纳入 training 层测试，避免产品模型以后游离在测试范围之外

## 9. 验收标准
- [x] ChallengeTrendChart 仍显示原有 Run focus 文案
- [x] ResultPage 仍显示原有 Run focus 文案
- [x] ResultPage 风险状态仍回到计划或自由热身
- [x] 健康状态仍可再挑战一次
- [x] training 层产品模型有纯函数测试覆盖
- [x] 构建、全量单测、e2e 通过

## 10. 质量门禁
- [x] `npm test -- --run src/training/__tests__/challenge-focus.test.js` 通过，5 tests passed
- [x] `npm test -- --run src/pages/__tests__/ResultPage.test.jsx` 通过，2 tests passed
- [x] `npm test -- --run src/pages/__tests__/ChallengePage.test.jsx` 通过，1 test passed
- [x] `npm test` 通过，257 tests passed
- [x] `npm run build` 通过
- [x] `npm run test:e2e` 通过，9 passed, 5 skipped
- [x] `git diff --check` 通过；仅有仓库 CRLF 提示

## 11. 回滚策略
如果共享模型引入意外行为，可回滚 `src/training/challenge-focus.js` 与两个组件 import 改动，恢复 ResultPage 和 ChallengeTrendChart 的本地映射。由于本轮不改阈值和文案，回滚不影响挑战引擎数据结构。

## 12. 下一轮候选
- 为结果页风险状态补一条 e2e 场景，覆盖从风险挑战回计划的完整 UI 路径
- 把首页挑战策略 CTA 也接入共享 action model，继续减少页面层产品判断
- 清理 release notes 顶部重复的迭代 10 记录
