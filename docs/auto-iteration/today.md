# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: 已完成

## 1. 今日主线
把结果页挑战风险状态的“Back to plan”动作纳入 e2e 守护。用户刚完成一次准确率风险挑战后，不只要看到 Run focus 解释，还要能从结果页直接回到当前训练计划，并且本地 active session context 真实写回 plan。

## 2. 问题背景
前几轮已经把挑战焦点、策略文案和动作模型沉淀到 training 层，并用单测保护了结果页风险状态的回计划动作。但主流产品不能只靠函数级正确：用户实际会从结果页点击按钮，进入练习页，并期望任务上下文真的切回计划。

## 3. 根因判断
- ResultPage 风险恢复路径此前主要由单测覆盖
- 现有 e2e 已覆盖首页恢复建议回计划，但没有覆盖“挑战完成后的结果页”入口
- 挑战动作模型后续还会继续扩张，缺少真实页面路径守护会增加回归风险
- URL 跳转、练习页首屏标题和 active session context 需要放在同一条验收链路里验证

## 4. 目标用户价值
用户从挑战结果页看到“准确率泄漏”风险时，点击 Back to plan 会真正回到训练计划，而不是只完成一次表面跳转。这个闭环让产品更像可信教练：它敢劝用户停下冲榜，也能把用户稳稳接回主线训练。

## 5. 工程价值
新增结果页风险恢复 e2e，覆盖从本地 session 趋势判断、结果页风险解释、Back to plan 点击、练习页落点到 active session context 的完整链路。以后改 ResultPage、challenge focus model 或 training plan store 时，回归会更早暴露。

## 6. 涉及模块
- `e2e/app.spec.js`：新增结果页挑战风险回计划端到端场景
- `docs/auto-iteration/today.md`：记录本轮需求、设计和验收
- `docs/auto-iteration/release-notes.md`：追加发布记录
- `docs/auto-iteration/decision-log.md`：追加决策记录

## 7. 非目标
- 不改变 ResultPage 产品文案
- 不改变挑战风险判断阈值
- 不改变训练计划启动逻辑
- 不新增移动端专属路径
- 不清理 release notes 的历史重复记录

## 8. 设计方案
1. 用 e2e localStorage seed 构造同一个 daily challenge 的两次记录
2. 第一轮准确率 98%，第二轮 WPM 提升但准确率下降到 92%，触发 `accuracy-risk`
3. 同时种入 active training plan 和 active session context
4. 直接进入 `/#/result?session=session-1`，验证结果页挑战战绩区出现
5. 验证 Run focus 显示准确率风险文案和相对上一轮 delta
6. 点击 Back to plan，验证 URL 回到 `/#/practice`
7. 验证练习页首屏标题为当前计划任务，并检查 active session context 仍为 plan

## 9. 验收标准
- [x] 结果页能显示 Daily challenge standing
- [x] 风险结果显示准确率泄漏 Run focus 文案
- [x] 风险结果显示相对上一轮的 WPM / accuracy delta
- [x] 点击 Back to plan 后进入 `/practice`
- [x] 练习页落到计划任务 `Reset accuracy`
- [x] `typemaster:v4:active-session-context.type === 'plan'`
- [x] 构建、全量单测、e2e 通过

## 10. 质量门禁
- [x] `npm run test:e2e -- --grep "result-page challenge risk"` 通过，1 passed, 1 skipped
- [x] `npm test` 通过，261 tests passed
- [x] `npm run build` 通过
- [x] `npm run test:e2e` 通过，10 passed, 6 skipped
- [x] `git diff --check` 通过；仅有仓库 CRLF 提示
- [x] 已检查 in-app browser；当前会话没有可用浏览器实例，已由 Playwright e2e 覆盖核心路径

## 11. 回滚策略
如果新增 e2e 在 CI 环境出现非产品逻辑导致的不稳定，可先回滚 `e2e/app.spec.js` 的新增用例，不影响产品运行代码；但不能删除 ResultPage 风险恢复能力本身，因为它已经是挑战教练闭环的一部分。

## 12. 下一轮候选
- 清理 release notes 顶部重复的迭代 10 记录
- 如果挑战模型继续增长，再考虑把 `challenge-focus.js` 重命名为更宽的 challenge coach model
- 为 ResultPage 的风险恢复卡增加更明确的“为什么建议回计划”视觉提示
