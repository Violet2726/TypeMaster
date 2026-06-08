# 发布记录

---

## 2026-06-08（迭代 17）

### 今日主线
把结果页挑战风险状态的 Back to plan 路径纳入 e2e 守护，验证用户从风险解释直接回到训练计划。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 用户可见体验保持不变
- 结果页准确率风险提示、Back to plan 按钮和计划练习落点现在有真实浏览器路径保护
- 挑战教练从“敢提示风险”进一步补强为“风险动作可被持续验证”

### 工程变化
- 新增结果页 challenge risk e2e 场景
- e2e seed 构造同一 daily challenge 的准确率风险趋势
- 断言结果页 Run focus 文案、delta、Back to plan 跳转、计划任务标题和 active session context

### 删除的旧逻辑
- 无删除产品逻辑，本次为质量守护增强

### 验证结果
- `npm run test:e2e -- --grep "result-page challenge risk"`: 通过，1 passed, 1 skipped
- `npm test`: 通过，261 tests passed
- `npm run build`: 通过
- `npm run test:e2e`: 通过，10 passed, 6 skipped
- `git diff --check`: 通过，仅有仓库 CRLF 提示
- in-app browser: 当前会话没有可用浏览器实例，已使用 Playwright e2e 覆盖核心路径

### 已知遗留
- release notes 顶部存在重复的迭代 10 记录，后续可单独清理
- 如果挑战模型继续扩张，可再评估是否重命名 `challenge-focus.js`
- ResultPage 风险恢复卡未来可以增加更强的视觉解释层

---

## 2026-06-08（迭代 16）

### 今日主线
把首页挑战卡的策略说明文案接入共享挑战策略模型，让首页不再维护页面层 `challengeStrategyState` 文案映射。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡文案和按钮行为保持不变
- 挑战建议的说明与主动作来自同一个模型，体验语义更一致
- 恢复状态仍会优先引导用户回计划或自由热身

### 工程变化
- 新增 `getChallengeStrategyNote`
- 新增 `buildChallengeStrategyModel`
- HomePage 改为消费 `note`、`primaryAction` 和 `primaryLabel`
- challenge-focus 测试补充 strategy state 文案映射和策略模型覆盖

### 删除的旧逻辑
- 删除 HomePage 页面内重复的 `challengeStrategyText` 映射
- 删除 HomePage 页面内策略说明文案分支判断

### 验证结果
- `npm test -- --run src/training/__tests__/challenge-focus.test.js`: 通过，9 tests passed
- `npm test -- --run src/pages/__tests__/HomePage.test.jsx`: 通过，2 tests passed
- `npm test`: 通过，261 tests passed
- `npm run build`: 通过
- `npm run test:e2e`: 通过，9 passed, 5 skipped
- `git diff --check`: 通过，仅有仓库 CRLF 提示
- in-app browser: 当前会话没有可用浏览器实例，已使用 Playwright e2e 覆盖核心路径

### 已知遗留
- 结果页风险状态的完整 UI 路径目前由单测覆盖，后续可补 e2e
- release notes 顶部存在重复的迭代 10 记录，后续可单独清理
- 如果挑战策略模型继续扩张，可再评估是否重命名 `challenge-focus.js`

---

## 2026-06-08（迭代 15）

### 今日主线
把首页挑战卡主 CTA 接入共享挑战动作模型，让首页和结果页复用同一套 challenge / plan / free 动作定义。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡健康状态仍可直接再挑战
- 首页挑战卡恢复状态仍会显示 Back to plan 或 Free practice
- 点击恢复按钮后会真正进入计划训练上下文，而不是只改变按钮文案

### 工程变化
- 新增 `buildChallengeActionModel`
- `buildChallengeFocusModel` 复用共享 action model
- HomePage 挑战 CTA 改为消费 `primaryAction` 和 `primaryLabel`
- HomePage 测试补充恢复按钮点击后的 plan context 断言
- challenge-focus 测试补充首挑战、再挑战与恢复优先级覆盖

### 删除的旧逻辑
- 删除 HomePage 页面内重复的挑战恢复 CTA 标签拼接
- 删除 HomePage 页面内基于 `challengeStrategyState` 的恢复动作分派分支

### 验证结果
- `npm test -- --run src/training/__tests__/challenge-focus.test.js`: 通过，7 tests passed
- `npm test -- --run src/pages/__tests__/HomePage.test.jsx`: 通过，2 tests passed
- `npm test -- --run src/pages/__tests__/ResultPage.test.jsx`: 通过，2 tests passed
- `npm test`: 通过，259 tests passed
- `npm run build`: 通过
- `npm run test:e2e`: 通过，9 passed, 5 skipped
- `git diff --check`: 通过，仅有仓库 CRLF 提示
- in-app browser: 当前会话没有可用浏览器实例，已使用 Playwright e2e 覆盖核心路径

### 已知遗留
- 首页挑战策略文案仍在 HomePage 中映射，后续可继续抽成共享 strategy model
- 结果页风险状态的完整 UI 路径目前由单测覆盖，后续可补 e2e
- release notes 顶部存在重复的迭代 10 记录，后续可单独清理

---

## 2026-06-08（迭代 14）

### 今日主线
把挑战单次焦点沉淀为共享产品模型，让挑战页与结果页复用同一套文案、恢复判断和主动作定义。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 用户可见体验保持不变
- 挑战页与结果页的 Run focus 解释继续一致
- 结果页风险状态仍会带用户回计划或自由热身，健康状态仍可再挑战一次

### 工程变化
- 新增 `src/training/challenge-focus.js`
- 新增 `src/training/__tests__/challenge-focus.test.js`
- ChallengeTrendChart 移除本地 focus 文案映射
- ResultPage 改为消费共享 focus model 的 `primaryAction` 和 `primaryLabel`
- Vitest 配置纳入 training 层测试

### 删除的旧逻辑
- 删除 ChallengeTrendChart 和 ResultPage 中重复的 focus 文案映射
- 删除 ResultPage 页面内重复的恢复 CTA 判断

### 验证结果
- `npm test -- --run src/training/__tests__/challenge-focus.test.js`: 通过，5 tests passed
- `npm test -- --run src/pages/__tests__/ResultPage.test.jsx`: 通过，2 tests passed
- `npm test -- --run src/pages/__tests__/ChallengePage.test.jsx`: 通过，1 test passed
- `npm test`: 通过，257 tests passed
- `npm run build`: 通过
- `npm run test:e2e`: 通过，9 passed, 5 skipped
- `git diff --check`: 通过，仅有仓库 CRLF 提示

### 已知遗留
- 首页挑战策略 CTA 仍有页面层判断，后续可继续接入共享 action model
- 结果页风险状态的完整 UI 路径目前由单测覆盖，后续可补 e2e
- release notes 顶部存在重复的迭代 10 记录，后续可单独清理

---

## 2026-06-08（迭代 13）

### 今日主线
把挑战结果页的 Run focus 升级为“解释 + 下一步动作”，让用户完成挑战后直接进入再挑战、回计划或自由热身。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 挑战结果页新增主 CTA，会根据本轮焦点状态自动切换
- 突破、稳定或混合状态下，用户可以直接“再挑战一次”
- 准确率风险或速度回落时，结果页会优先引导用户回训练计划；没有计划时引导自由热身
- “查看榜单”继续保留为次级动作

### 工程变化
- ResultPage 新增挑战主动作状态与处理函数
- 复用已有 challenge focus state，不新增结果页专属风险规则
- 扩展 ResultPage 页面测试，覆盖再挑战和风险回计划路径

### 删除的旧逻辑
- 无删除业务能力，本次为结果页挑战闭环增强

### 验证结果
- `npm test -- --run src/pages/__tests__/ResultPage.test.jsx`: 通过，2 tests passed
- `npm test`: 通过，252 tests passed
- `npm run build`: 通过
- `npm run test:e2e`: 通过，9 passed, 5 skipped
- in-app browser: 当前会话没有可用浏览器实例，已使用 Playwright e2e 覆盖核心路径

### 已知遗留
- ResultPage 与 ChallengeTrendChart 暂时各自维护 focus 文案映射，后续可抽共享 helper
- 结果页风险状态的完整 UI 路径目前由单测覆盖，后续可补 e2e
- release notes 顶部存在重复的迭代 10 记录，后续可单独清理

---

## 2026-06-08（迭代 12）

### 今日主线
把挑战单次教练判断前置到 ResultPage，让用户刚完成每日挑战后直接看到这轮表现的训练意义。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 挑战结果页新增 Run focus / 本次细看反馈块
- 结果页会显示当前挑战相对上次的 WPM / accuracy 变化
- 即使用户不进入 ChallengePage，也能知道下一轮适合继续加压还是先稳住

### 工程变化
- ResultPage 复用 `getChallengePointFocusState` 和当日挑战趋势 helper
- 新增结果页挑战焦点块样式
- 扩展 ResultPage 页面测试，覆盖突破型焦点判断

### 删除的旧逻辑
- 无删除业务能力，本次为结果页挑战反馈增强

### 验证结果
- `npm test`: 通过，251 tests passed
- `npm run build`: 通过
- `npm run test:e2e`: 通过，9 passed, 5 skipped
- in-app browser: 当前会话没有可用浏览器实例，已使用 Playwright e2e 覆盖核心路径

### 已知遗留
- ResultPage 与 ChallengeTrendChart 暂时各自维护 focus 文案映射，后续可抽共享 helper
- release notes 顶部存在重复的迭代 10 记录，后续可单独清理

---

## 2026-06-08（迭代 11）

### 今日主线
把 ChallengePage 的今日挑战趋势升级为“数值回放 + 单次教练判断”，让用户点选某次挑战时直接看到下一步动作解释。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 今日挑战趋势的“本次细看 / Run focus”新增教练判断文案
- 最新一次挑战会默认展示本次表现属于提速突破、准确率风险、速度回落、稳定或混合变化
- 焦点说明带有轻量状态视觉，方便用户扫一眼判断是否继续冲榜

### 工程变化
- 新增 `getChallengePointFocusState` 单次挑战焦点状态 helper
- 更新 `ChallengeTrendChart` 展示焦点说明
- 扩展中英文训练文案
- 补充引擎单测和 ChallengePage 页面测试

### 删除的旧逻辑
- 无删除业务能力，本次为挑战趋势解释层增强

### 验证结果
- `npm test`: 通过，251 tests passed
- `npm run build`: 通过
- `npm run test:e2e`: 通过，9 passed, 5 skipped
- in-app browser: 当前会话没有可用浏览器实例，已使用 Playwright e2e 覆盖核心路径

### 已知遗留
- 单次焦点判断暂未同步到 ResultPage
- release notes 顶部存在重复的迭代 10 记录，后续可单独清理

---

## 2026-06-08（迭代 10）

### 今日主线
给首页挑战卡补上“什么时候不建议继续冲榜”的边界提示，并把用户直接带回训练主线。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡新增 recovery 边界建议
- 当今日挑战状态明显回落时，首页会建议先回计划或先去热身
- 用户可以直接从挑战卡切回训练主线，而不是继续无效冲榜

### 工程变化
- 扩展 `src/engine/challenge.js` strategy state helper
- 更新 `src/pages/HomePage.jsx`
- 更新 `src/training/copy.js`
- 更新 `src/pages/__tests__/HomePage.test.jsx`
- 更新 `e2e/app.spec.js`

### 删除的旧逻辑
- 无删除业务能力，本次为首页建议边界增强

### 验证结果
- npm test: ✅ 通过（249 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（9 passed, 4 skipped）

### 已知遗留
- ChallengePage 趋势图仍缺少更细的焦点态说明
- 首页挑战卡还没有“建议何时停止继续冲榜”的更细边界层级

---

## 2026-06-08（迭代 10）

### 今日主线
给首页挑战卡补上“什么时候不建议继续冲榜”的边界提示，并把用户直接带回训练主线。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡新增 recovery 边界建议
- 当今日挑战状态明显回落时，首页会建议先回计划或先去热身
- 用户可以直接从挑战卡切回训练主线，而不是继续无效冲榜

### 工程变化
- 扩展 `src/engine/challenge.js` strategy state helper
- 更新 `src/pages/HomePage.jsx`
- 更新 `src/training/copy.js`
- 更新 `src/pages/__tests__/HomePage.test.jsx`
- 更新 `e2e/app.spec.js`

### 删除的旧逻辑
- 无删除业务能力，本次为首页建议边界增强

### 验证结果
- npm test: ✅ 通过（249 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（9 passed, 4 skipped）

### 已知遗留
- ChallengePage 趋势图仍缺少更细的焦点态说明
- 首页挑战卡还没有“建议何时停止继续冲榜”的更细边界层级

---

## 2026-06-08

### 今日主线
首页“今日行动区”重构，把推荐训练、每日挑战和自由练习收敛到同一屏。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页新增三张行动卡片：推荐训练、每日挑战、自由练习
- 用户可以从首页直接进入每日挑战练习页
- 首页更明确展示计划进度、当前短板与挑战入口

### 工程变化
- 重构 `src/pages/HomePage.jsx` 首页结构
- 扩展 `src/training/copy.js` 中英文产品文案
- 为首页新增行动卡片样式 `index.css`
- 更新 `src/pages/__tests__/HomePage.test.jsx`
- 新增首页挑战入口 e2e：`e2e/app.spec.js`

### 删除的旧逻辑
- 移除首页 Hero 中重复的首要按钮布局，改为统一行动区承接

### 验证结果
- npm test: ✅ 通过（236 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（5 passed, 3 skipped）

### 已知遗留
- 首页尚未展示挑战榜单预览和个人名次
- 云端 challenge API 未启动时，仍依赖本地 fallback 数据

---

## 2026-06-08（迭代 2）

### 今日主线
补齐每日挑战结果闭环，让结果页直接展示挑战战绩。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 挑战完成后，结果页新增“每日挑战战绩”卡片
- 卡片展示当前名次、参与人数、超过选手比例和个人最佳状态
- 结果页新增“查看挑战榜单”入口

### 工程变化
- 新增 `src/engine/challenge.js` 纯逻辑模块
- 新增 `src/engine/__tests__/challenge.test.js`
- 更新 `src/store/practice-store.jsx`，在挑战完成后乐观更新榜单
- 更新 `src/pages/ResultPage.jsx` 和 `src/pages/__tests__/ResultPage.test.jsx`
- 新增 `src/hooks/__tests__/useTypingSession.test.jsx`，修复最后一词双提交问题
- 更新 `src/i18n/index.js` 挑战结果文案
- 更新 `e2e/app.spec.js` 挑战结果闭环用例

### 删除的旧逻辑
- 无删除业务能力，本次为挑战链路增强

### 验证结果
- npm test: ✅ 通过（243 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（6 passed, 4 skipped）

### 已知遗留
- 当前个人最佳仍基于本地 session 样本，不是跨设备汇总
- challenge API 未启动时，排行榜仍走本地 fallback

---

## 2026-06-08（迭代 3）

### 今日主线
把挑战战绩继续前置到首页和挑战页，强化回访入口。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡新增当前名次预览与“查看榜单”入口
- ChallengePage 新增个人战绩卡
- ChallengePage 新增同级别对比模块，帮助用户判断相近水平位置

### 工程变化
- 扩展 `src/engine/challenge.js` helper
- 更新 `src/pages/HomePage.jsx`、`src/pages/ChallengePage.jsx`
- 更新 `src/training/copy.js` 与 `index.css`
- 更新 `src/pages/__tests__/HomePage.test.jsx`、`src/pages/__tests__/ChallengePage.test.jsx`
- 更新 `e2e/app.spec.js` 首页到挑战榜单页路径

### 删除的旧逻辑
- 无删除业务能力，本次为挑战回访链路增强

### 验证结果
- npm test: ✅ 通过（245 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（8 passed, 4 skipped）

### 已知遗留
- 首页挑战卡还没有展示“是否刷新个人最佳”的更强提示
- ChallengePage 尚未提供挑战历史趋势

---

## 2026-06-08（迭代 4）

### 今日主线
把挑战状态继续前置到首页与挑战页，增强回访层反馈。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡展示当前名次预览
- 首页挑战卡新增“查看榜单”入口
- ChallengePage 新增个人战绩卡与同级别对比模块

### 工程变化
- 扩展 `src/engine/challenge.js` helper
- 更新 `src/pages/HomePage.jsx`、`src/pages/ChallengePage.jsx`
- 更新 `src/training/copy.js` 与 `index.css`
- 更新 `src/pages/__tests__/HomePage.test.jsx`、`src/pages/__tests__/ChallengePage.test.jsx`
- 更新 `e2e/app.spec.js`，补充首页到挑战榜单页路径验证

### 删除的旧逻辑
- 无删除业务能力，本次为挑战入口层反馈增强

### 验证结果
- npm test: ✅ 通过（245 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（8 passed, 4 skipped）

### 已知遗留
- 首页挑战卡还没有明确提示“今日是否刷新个人最佳”
- ChallengePage 还没有提供历史趋势与波动回放

---

## 2026-06-08（迭代 5）

### 今日主线
补强挑战回访动力，加入更强的个人最佳提示与今日挑战回放。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡更明确地展示“今天第一条成绩 / 已刷新最佳 / 距最佳差距”
- ChallengePage 新增“今日挑战回放”模块
- ChallengePage 可查看今日尝试次数、最佳速度、距最佳差距与最近几次记录

### 工程变化
- 扩展 `src/engine/challenge.js` 历史 helper
- 更新 `src/pages/HomePage.jsx`、`src/pages/ChallengePage.jsx`
- 更新 `src/training/copy.js`
- 更新 `src/engine/__tests__/challenge.test.js`
- 更新 `src/pages/__tests__/HomePage.test.jsx`、`src/pages/__tests__/ChallengePage.test.jsx`
- 更新 `e2e/app.spec.js`

### 删除的旧逻辑
- 无删除业务能力，本次为挑战反馈增强

### 验证结果
- npm test: ✅ 通过（246 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（8 passed, 4 skipped）

### 已知遗留
- ChallengePage 仍未提供更图形化的成绩波动趋势
- 首页挑战卡还没有给出“是否值得再来一轮”的策略提示

---

## 2026-06-08（迭代 6）

### 今日主线
强化挑战回访反馈，加入更明确的个人最佳提示和今日挑战回放。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡更明确提示今天是否刷新个人最佳
- ChallengePage 新增今日挑战回放模块
- ChallengePage 可查看今天的尝试次数、最佳速度、距最佳差距和最近几次记录

### 工程变化
- 扩展 `src/engine/challenge.js` 当日挑战历史 helper
- 更新 `src/pages/HomePage.jsx`、`src/pages/ChallengePage.jsx`
- 更新 `src/training/copy.js`
- 更新 `src/engine/__tests__/challenge.test.js`
- 更新 `src/pages/__tests__/HomePage.test.jsx`、`src/pages/__tests__/ChallengePage.test.jsx`
- 更新 `e2e/app.spec.js`

### 删除的旧逻辑
- 无删除业务能力，本次为挑战反馈增强

### 验证结果
- npm test: ✅ 通过（246 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（8 passed, 4 skipped）

### 已知遗留
- ChallengePage 仍缺少图形化的成绩波动趋势
- 首页挑战卡还没有给出“是否值得再来一轮”的策略建议

---

## 2026-06-08（迭代 7）

### 今日主线
为 ChallengePage 增加今日挑战趋势图，让速度与准确率变化一眼可见。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- ChallengePage 新增“今日挑战趋势”图表
- 图表直接展示首次、最新、速度变化、准确率变化
- 页面会给出今天整体趋势结论，帮助用户判断是否继续提速

### 工程变化
- 新增 `src/components/ChallengeTrendChart.jsx`
- 扩展 `src/engine/challenge.js` 趋势 helper
- 更新 `src/pages/ChallengePage.jsx`
- 更新 `src/training/copy.js`
- 更新 `src/engine/__tests__/challenge.test.js`
- 更新 `src/pages/__tests__/ChallengePage.test.jsx`
- 更新 `e2e/app.spec.js`

### 删除的旧逻辑
- 无删除业务能力，本次为挑战趋势可视化增强

### 验证结果
- npm test: ✅ 通过（247 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（8 passed, 4 skipped）

### 已知遗留
- 首页挑战卡仍缺少“是否值得再来一轮”的策略建议
- 趋势图目前是静态摘要，未提供更细的 hover 焦点解释

---

## 2026-06-08（迭代 8）

### 今日主线
把挑战趋势结论前置到首页，形成明确的下一步建议。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡新增“下一步建议”
- 建议会基于今日挑战状态变化为继续冲榜、先稳准确率或扩大样本
- 用户不进入 ChallengePage 也能直接知道今天是否值得再来一轮

### 工程变化
- 扩展 `src/engine/challenge.js` 趋势状态 helper
- 更新 `src/pages/HomePage.jsx`
- 更新 `src/training/copy.js`
- 更新 `index.css`
- 更新 `src/engine/__tests__/challenge.test.js`
- 更新 `src/pages/__tests__/HomePage.test.jsx`
- 更新 `e2e/app.spec.js`

### 删除的旧逻辑
- 无删除业务能力，本次为首页建议层增强

### 验证结果
- npm test: ✅ 通过（248 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（8 passed, 4 skipped）

### 已知遗留
- ChallengePage 趋势图仍缺少更细的焦点态说明
- 首页挑战卡还没有提示“什么时候不建议继续冲榜”

---

## 2026-06-08（迭代 9）

### 今日主线
把挑战趋势从“总览”升级成“总览 + 单次细看”，并把建议前置到首页。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
- 首页挑战卡新增更明确的“下一步建议”
- ChallengePage 趋势图新增 Run focus 细看卡片
- 用户可以切换查看某次挑战相对上一次的 WPM 和准确率变化

### 工程变化
- 扩展 `src/engine/challenge.js` trend point / trend state helper
- 更新 `src/components/ChallengeTrendChart.jsx`
- 更新 `src/pages/HomePage.jsx`
- 更新 `src/training/copy.js`
- 更新 `src/engine/__tests__/challenge.test.js`
- 更新 `src/pages/__tests__/HomePage.test.jsx`、`src/pages/__tests__/ChallengePage.test.jsx`
- 更新 `e2e/app.spec.js`

### 删除的旧逻辑
- 无删除业务能力，本次为挑战趋势解释层增强

### 验证结果
- npm test: ✅ 通过（248 tests passed）
- npm run build: ✅ 通过
- npm run test:e2e: ✅ 通过（8 passed, 4 skipped）

### 已知遗留
- 首页挑战卡仍没有“建议停止继续冲榜”的边界提示
- ChallengePage 趋势图还没有更强的状态切换动效

---

## 2026-05-10

### 今日主线
每日状态巡检（非迭代日）。

### 合并分支
无（巡检日，main 无需合并）

### 用户可见变化
无直接用户可见变化。本次为日常巡检，确认项目状态稳定。

### 工程变化
- 确认仓库同步正常
- 确认构建和测试通过（npm install ✅, npm run build ✅, npm test ✅）
- 确认 main 分支稳定（commit: 468f84d）
- 安全检查通过（无密钥泄露）

### 删除的旧逻辑
无

### 验证结果
- npm install: ✅ 通过（180 packages）
- npm run build: ✅ 通过（3.49s, 301.48 kB）
- npm test: ✅ 通过（117 tests, 4 files）

### 已知遗留
无

### main commit
468f84d30de6ba87d75dd5de86def22cbca8807（无变更）

---

## 2026-05-09

### 今日主线
为 `useTypingSession` 核心 Hook 建立自动化测试基线（目标 20-30 个测试用例覆盖核心时序逻辑）。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
无直接用户可见变化。本次更新建立了 useTypingSession 的自动化测试基线，为未来更安全的代码迭代奠定基础。

### 工程变化
- 新增 `src/engine/session-machine.js` - 抽取 useTypingSession 中的纯函数逻辑
- 新增 `src/engine/__tests__/session-machine.test.js` - 61 个测试用例
- 修改 `src/hooks/useTypingSession.jsx` - 使用抽取的纯函数
- 修改 `src/engine/index.js` - 导出新模块
- 修改 `vitest.config.js` - 扩展测试文件匹配

### 删除的旧逻辑
无

### 验证结果
- npm install: ✅ 通过（180 packages）
- npm run build: ✅ 通过（2.41s）
- npm test: ✅ 通过（117 tests, 4 files）

### 已知遗留
无

### main commit
c53a79f fix(auto): resolve quality gate failures and clean obsolete logic

---

## 版本 2.0.3

### 发布日期
待定

### 变更类型
待定

### 说明
等待下次迭代完成后更新。

---

## 版本 2.0.2

### 发布日期
2026-05-08

### 变更类型
devops

### 用户可见变化
无直接用户可见变化。本次更新建立了自动化 CI/CD 流水线。

### 技术变化
- 新增 `.github/workflows/ci.yml` GitHub Actions 配置文件
- 触发条件：push 到 main 分支 + pull request 合并到 main
- Pipeline 步骤：npm ci → npm run build → npm test

---

## 版本 2.0.1

### 发布日期
2026-05-08

### 变更类型
test

### 用户可见变化
无直接用户可见变化。本次更新建立了 engine 核心模块的自动化测试基线。

### 技术变化
- 引入 Vitest ^2.1.0 测试框架
- 新增 56 个测试用例覆盖 metrics、coach、insights 模块

---

## 版本 2.0.0

### 发布日期
2026-05-07

### 主要功能
- 双入口首页
- 训练工作台
- AI 文本状态管理
- 结果页反馈
- 教练建议兜底
- 成长洞察页
- 双语界面
- 本地持久化

---

## 版本记录格式

### 版本号格式
X.Y.Z

- X：重大版本更新，可能包含不兼容变更
- Y：次要功能更新，向后兼容
- Z：补丁修复，向后兼容
