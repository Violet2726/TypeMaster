# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: 已完成

## 1. 今日主线
把挑战结果页的 Run focus 从“只解释表现”升级成“解释表现 + 直接给下一步动作”。用户完成每日挑战后，如果本轮状态健康，可以一键再挑战；如果出现准确率风险或速度回落，主按钮会带用户回到训练计划或自由热身。

## 2. 问题背景
上一轮已经让 ResultPage 能解释本次挑战的单次焦点，但页面的主动作仍然没有跟随焦点状态变化。也就是说，产品已经知道用户可能需要“先稳住”，但按钮仍然没有把这个判断转成可执行路径。

## 3. 根因判断
- 结果页挑战卡已有焦点状态，但 CTA 仍偏静态
- 风险状态下继续鼓励冲榜，会削弱产品作为训练教练的可信度
- 首页已有“回计划 / 去热身”的恢复策略，结果页还没有继承这条产品原则

## 4. 目标用户价值
挑战结束后，用户不需要自己解读按钮含义：突破或稳定时继续挑战，准确率风险或速度回落时先回主线训练。结果页因此更像一个会收束节奏的教练，而不是只会展示战绩的看板。

## 5. 工程价值
结果页复用现有 `getChallengePointFocusState` 输出，不新增一套恢复判断规则。动作层只根据焦点状态切换 `startDailyChallenge`、`startTrainingPlanStep` 和 `resetPracticeToBuiltin`，保持挑战、计划、自由练习三条路径清晰。

## 6. 涉及模块
- `src/pages/ResultPage.jsx`：挑战战绩卡新增主 CTA 决策与跳转动作
- `src/pages/__tests__/ResultPage.test.jsx`：覆盖再挑战路径和风险状态回计划路径
- `docs/auto-iteration/today.md`：记录本轮需求、设计和验收
- `docs/auto-iteration/release-notes.md`：追加发布记录
- `docs/auto-iteration/decision-log.md`：追加决策记录

## 7. 非目标
- 不改变榜单同步逻辑
- 不改变 challenge API
- 不重写挑战趋势图
- 不清理 release notes 顶部重复迭代记录

## 8. 设计方案
1. ResultPage 根据 `challengeFocusState` 判断是否需要恢复训练节奏
2. `accuracy-risk` 与 `speed-drop` 视为恢复状态
3. 恢复状态且存在 `activeTrainingStep` 时，主按钮显示“先回计划 / Back to plan”
4. 恢复状态且没有计划步骤时，主按钮显示“先去热身 / Free practice”
5. 健康或中性状态下，主按钮显示“再挑战一次 / Retry challenge”
6. 再挑战动作调用 `startDailyChallenge()` 后进入 `/practice`
7. 恢复动作调用 `startTrainingPlanStep()` 或 `resetPracticeToBuiltin()` 后进入 `/practice`
8. “查看榜单”继续作为次级动作保留

## 9. 验收标准
- [x] 挑战结果页健康状态下可点击“再挑战一次”进入练习页
- [x] “再挑战一次”会调用 `startDailyChallenge`
- [x] 准确率风险状态下，存在训练计划时主按钮变为“先回计划 / Back to plan”
- [x] 风险恢复动作不会误触发 `startDailyChallenge`
- [x] 原有“查看榜单”入口仍保留
- [x] 构建、全量单测、e2e 通过

## 10. 质量门禁
- [x] `npm test -- --run src/pages/__tests__/ResultPage.test.jsx` 通过，2 tests passed
- [x] `npm test` 通过，252 tests passed
- [x] `npm run build` 通过
- [x] `npm run test:e2e` 通过，9 passed, 5 skipped
- [x] 已重试 in-app browser 检查；当前会话没有可用浏览器实例，已由 Playwright e2e 覆盖核心用户路径

## 11. 回滚策略
如果结果页动作策略造成用户误解，可回滚 ResultPage 中的 `challengePrimaryLabel` 与 `handleChallengePrimaryAction` 新逻辑，保留上一轮 Run focus 展示块和榜单入口不受影响。

## 12. 下一轮候选
- 抽出共享的 challenge focus 文案与动作模型，减少 ResultPage 与 ChallengeTrendChart 的重复
- 为结果页风险状态补一条 e2e 场景，覆盖从风险挑战回计划的完整 UI 路径
- 清理 release notes 顶部重复的迭代 10 记录
