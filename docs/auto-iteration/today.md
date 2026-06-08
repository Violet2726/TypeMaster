# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: 已完成

## 1. 今日主线
把首页挑战卡的主 CTA 接入共享挑战动作模型。首页不再自己判断“恢复时显示回计划还是去热身”，而是复用 `buildChallengeActionModel` 输出的 `primaryAction` 和 `primaryLabel`，让首页、结果页在挑战恢复节奏上保持同一种产品语言。

## 2. 问题背景
上一轮已经把结果页和挑战趋势图的 focus 解释沉淀到 training 层，但首页挑战卡仍有页面层 CTA 判断。它虽然行为正确，但会让“挑战恢复动作”继续在多个入口分叉：结果页读模型，首页自己拼判断。

## 3. 根因判断
- `HomePage` 仍根据 `challengeStrategyState === 'recover'` 自行拼接 CTA 标签
- 首页点击恢复按钮的测试只验证文案，没有验证真实进入 plan context
- 共享模型只服务 focus state，还没有抽出可被首页策略状态复用的 action model

## 4. 目标用户价值
用户从首页进入挑战恢复路径时，产品行为更可信：如果系统认为冲榜已经透支，点击“Back to plan”会真正进入计划训练上下文，而不是只在 UI 上看起来像恢复。这个细节很小，但它是产品“像教练而不是入口集合”的关键。

## 5. 工程价值
新增 `buildChallengeActionModel` 作为更底层的挑战动作模型，让 `buildChallengeFocusModel` 和 HomePage 都复用它。这样后续不管入口来自首页、结果页还是新的教练卡，都可以共享“challenge / plan / free”的动作分派。

## 6. 涉及模块
- `src/training/challenge-focus.js`：新增 `buildChallengeActionModel`，并让 focus model 复用它
- `src/training/__tests__/challenge-focus.test.js`：补充首挑战、再挑战、恢复优先级测试
- `src/pages/HomePage.jsx`：首页挑战 CTA 改为读取共享 action model
- `src/pages/__tests__/HomePage.test.jsx`：补充点击 Back to plan 后写入 plan context 的断言
- `docs/auto-iteration/today.md`：记录本轮需求、设计和验收
- `docs/auto-iteration/release-notes.md`：追加发布记录
- `docs/auto-iteration/decision-log.md`：追加决策记录

## 7. 非目标
- 不改变挑战策略阈值
- 不改变首页视觉布局
- 不新增新的挑战文案
- 不修改 e2e 用例数量

## 8. 设计方案
1. `buildChallengeActionModel(trainingCopy, options)` 输出 `shouldRecover`、`primaryAction`、`primaryLabel`
2. 非恢复状态根据 `hasPriorChallenge` 区分“Start challenge”和“Retry challenge”
3. 恢复状态优先输出 `primaryAction: plan | free`，且恢复标签优先于 loading 标签
4. `buildChallengeFocusModel` 继续保留 focus note，但把 action 部分委托给 `buildChallengeActionModel`
5. HomePage 根据 `challengeStrategyState === 'recover'` 只传入 `shouldRecover`，不再自己拼 CTA
6. HomePage 点击 `primaryAction: plan` 时复用推荐训练入口，点击 `free` 时进入自由热身，点击 `challenge` 时启动每日挑战
7. HomePage 测试点击恢复按钮后验证 `typemaster:v4:active-session-context.type === 'plan'`

## 9. 验收标准
- [x] 首页健康挑战状态仍显示 Retry challenge
- [x] 首页恢复状态仍显示 Back to plan
- [x] 点击 Back to plan 后进入 `/practice`
- [x] 点击 Back to plan 后写入 plan active session context
- [x] 共享 action model 覆盖首挑战、再挑战、恢复优先级
- [x] 构建、全量单测、e2e 通过

## 10. 质量门禁
- [x] `npm test -- --run src/training/__tests__/challenge-focus.test.js` 通过，7 tests passed
- [x] `npm test -- --run src/pages/__tests__/HomePage.test.jsx` 通过，2 tests passed
- [x] `npm test -- --run src/pages/__tests__/ResultPage.test.jsx` 通过，2 tests passed
- [x] `npm test` 通过，259 tests passed
- [x] `npm run build` 通过
- [x] `npm run test:e2e` 通过，9 passed, 5 skipped
- [x] `git diff --check` 通过；仅有仓库 CRLF 提示
- [x] 已重试 in-app browser 检查；当前会话没有可用浏览器实例，已由 Playwright e2e 覆盖核心路径

## 11. 回滚策略
如果首页 CTA 出现异常，可回滚 HomePage 对 `buildChallengeActionModel` 的接入，暂时恢复原页面层判断；共享模型保留给 ResultPage 和后续入口使用，不影响挑战引擎与榜单数据。

## 12. 下一轮候选
- 为结果页风险状态补一条 e2e 场景，覆盖从风险挑战回计划的完整 UI 路径
- 把首页挑战策略文案也抽入共享 strategy model，继续减少页面层文案判断
- 清理 release notes 顶部重复的迭代 10 记录
