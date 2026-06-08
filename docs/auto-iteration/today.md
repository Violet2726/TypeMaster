# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: ✅ 已完成

## 1. 今日主线
把挑战战绩从结果页继续前置到首页和挑战页，让用户在进入挑战前就能看到今天的状态与同级别位置。

## 2. 问题背景
上一轮已经补齐挑战结果页闭环，但首页仍然只展示挑战入口，ChallengePage 也缺少“我的战绩卡”。用户要先打完挑战再回看结果，回访理由没有被提前展示出来。

## 3. 根因判断
- 首页挑战卡缺少“你今天第几名”的即时反馈
- ChallengePage 只有榜单，没有个人成绩和同级别对比
- 挑战辅助逻辑虽已存在，但还没有消费到回访入口层

## 4. 目标用户价值
让用户打开首页就知道自己今天是否已经上榜，进入挑战页后立刻看见自己的战绩和同级别位置，增强“再来一轮”的动机。

## 5. 工程价值
复用已有挑战 helper，把首页、挑战页、结果页建立在同一套名次与最佳逻辑上，减少未来维护分叉。

## 6. 涉及模块
- src/pages/HomePage.jsx → 首页挑战卡新增今日名次预览与榜单入口 ✅
- src/pages/ChallengePage.jsx → 新增个人战绩卡与同级别对比 ✅
- src/engine/challenge.js → 新增当前挑战会话与同级别榜单 helper ✅
- src/engine/__tests__/challenge.test.js → 扩展 helper 覆盖 ✅
- src/training/copy.js → 新增首页/挑战页挑战文案 ✅
- index.css → 补充挑战卡动作区样式 ✅
- src/pages/__tests__/HomePage.test.jsx / ChallengePage.test.jsx → 覆盖新页面状态 ✅
- e2e/app.spec.js → 新增首页直达榜单页路径验证 ✅

## 7. 非目标
- 今日不做社交分享与好友系统
- 不改 challenge 云端协议
- 不做排行榜分页或更多筛选

## 8. 设计方案
1. 首页挑战卡展示当前名次预览与榜单入口
2. ChallengePage 拆成三层：头部 CTA、个人战绩卡、同级别对比、完整榜单
3. 继续沿用结果页里的排名与最佳判断逻辑
4. 同级别对比优先按 levelId 过滤，帮助用户理解相近水平位置

## 9. 验收标准
- [x] 首页挑战卡可见当前名次预览
- [x] 首页可直接跳转查看挑战榜单
- [x] ChallengePage 可见个人战绩卡与同级别对比
- [x] 单测与 e2e 覆盖新增路径

## 10. 质量门禁
- [x] npm run build ✅
- [x] npm test ✅ (245 passed)
- [x] npm run test:e2e ✅ (8 passed, 4 skipped)

## 11. 回滚策略
若挑战入口层展示造成认知噪音，优先回退 HomePage 与 ChallengePage 的挑战卡展示，不动结果页与榜单核心逻辑。

## 12. 下一轮候选
- 首页加入“今日挑战是否刷新个人最佳”的更强反馈
- ChallengePage 增加成绩波动趋势和历史最佳回放
- 继续拆分 practice-store，减少挑战与计划状态耦合
