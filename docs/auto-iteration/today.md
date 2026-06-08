# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: ✅ 已完成

## 1. 今日主线
补强挑战回访动力：让首页明确提示“今天是否刷新个人最佳”，并让 ChallengePage 能回看今日挑战历史。

## 2. 问题背景
上一轮已经把挑战状态前置到首页和挑战页，但用户仍然缺少“今天比刚才好没好”的即时感知，ChallengePage 也还看不到今天几次挑战的波动过程。

## 3. 根因判断
- 首页挑战卡虽然能看到名次，但“是否刷新个人最佳”不够明确
- ChallengePage 缺少今日挑战历史回放，用户无法判断继续挑战的价值
- 现有挑战 helper 还没有直接服务“历史回放”场景

## 4. 目标用户价值
让用户打开首页就知道“今天是不是刷新了最佳”，进入 ChallengePage 后还能回看今天的几次尝试，从而更自然地决定是否继续冲击下一轮。

## 5. 工程价值
继续复用同一套 challenge helper，把“当前状态、最佳成绩、历史尝试”全部落在纯函数层，避免页面各自拼装逻辑。

## 6. 涉及模块
- src/pages/HomePage.jsx → 首页挑战卡强化“个人最佳状态”反馈 ✅
- src/pages/ChallengePage.jsx → 新增今日挑战回放与最佳成绩提示 ✅
- src/engine/challenge.js → 新增 challenge session 历史 helper ✅
- src/engine/__tests__/challenge.test.js → 扩展历史 helper 单测 ✅
- src/training/copy.js → 新增挑战历史回放文案 ✅
- src/pages/__tests__/HomePage.test.jsx / ChallengePage.test.jsx → 覆盖更强反馈与历史回放 ✅
- e2e/app.spec.js → 扩展首页到 ChallengePage 的历史回放验证 ✅

## 7. 非目标
- 今日不做跨天挑战历史
- 不新增社交分享或好友排行
- 不改 challenge API 协议

## 8. 设计方案
1. 首页挑战卡优先展示“今天第一条成绩”或“已刷新最佳”等更强结论
2. ChallengePage 新增“今日挑战回放”模块，展示尝试次数、最佳速度、距最佳差距和最近几次记录
3. 历史记录只围绕当前 challengeId 过滤，不引入跨天混淆
4. 继续沿用既有排名 / 最佳判断规则，避免产品口径分叉

## 9. 验收标准
- [x] 首页挑战卡可见更明确的个人最佳状态
- [x] ChallengePage 可见今日挑战回放
- [x] ChallengePage 可见最佳成绩与距最佳差距
- [x] 单测与 e2e 覆盖新增反馈路径

## 10. 质量门禁
- [x] npm run build ✅
- [x] npm test ✅ (246 passed)
- [x] npm run test:e2e ✅ (8 passed, 4 skipped)

## 11. 回滚策略
若挑战历史回放信息过载，优先回退 ChallengePage 的历史模块和首页的强化提示，不动已有榜单与结果页逻辑。

## 12. 下一轮候选
- ChallengePage 加入更直观的挑战成绩波动趋势
- 首页挑战卡加入“是否值得再来一轮”的建议化提示
- 继续拆分 practice-store，减少挑战与计划状态耦合
