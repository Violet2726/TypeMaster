# 今日自治迭代计划

## 状态
- **current_phase**: implemented
- **执行日期**: 2026-06-08
- **完成状态**: ✅ 已完成

## 1. 今日主线
给首页挑战卡补上“什么时候不建议继续冲榜”的边界提示，并把用户直接带回训练主线。

## 2. 问题背景
上一轮已经把挑战趋势和建议前置到首页，但首页仍然只会鼓励“继续冲榜”。当用户今天已经连续几次明显回落时，产品还缺少一个明确的“先停一停，回计划训练”的边界提示。

## 3. 根因判断
- 首页挑战卡缺少“不要继续冲榜”的边界建议
- 当前趋势状态无法区分“轻微回落”和“已经明显透支”
- 没有把“建议回计划训练”的判断直接串到行动按钮

## 4. 目标用户价值
当用户今天的挑战状态已经明显回落时，首页就能及时劝停，并把用户带回更适合的训练主线，避免无效反复冲榜。

## 5. 工程价值
把趋势判断进一步抽象成 strategy state，让首页建议、ChallengePage 趋势图和未来教练策略共用同一套边界规则。

## 6. 涉及模块
- `src/pages/HomePage.jsx`：首页挑战卡新增 recovery 边界动作 ✅
- `src/engine/challenge.js`：新增 challenge strategy state helper ✅
- `src/engine/__tests__/challenge.test.js`：覆盖 recover 状态判断 ✅
- `src/training/copy.js`：新增 recover 文案与 CTA ✅
- `src/pages/__tests__/HomePage.test.jsx`：覆盖 recovery 建议 ✅
- `e2e/app.spec.js`：覆盖 recovery CTA 回到计划路径 ✅

## 7. 非目标
- 今日不新增新的挑战模式
- 不做跨天建议逻辑
- 不改 challenge API 协议

## 8. 设计方案
1. 在现有 trend state 之外新增 `recover` 策略状态
2. 当尝试次数足够多且速度/准确率明显回落时，首页挑战卡改为建议“先回计划”
3. 如果当前没有计划，则退化为“先去热身”
4. 保持首页建议与趋势图判断口径一致

## 9. 验收标准
- [x] 首页挑战卡可见“停止继续冲榜”的边界建议
- [x] recovery 状态下首页 CTA 会切换为回计划或热身
- [x] 单测与 e2e 覆盖 recovery 提示路径
- [x] 构建与全量测试通过

## 10. 质量门禁
- [x] `npm run build` ✅
- [x] `npm test` ✅（249 passed）
- [x] `npm run test:e2e` ✅（9 passed, 4 skipped）

## 11. 回滚策略
若边界提示过于激进，优先回退 `recover` 状态和首页 CTA 切换逻辑，不动已有趋势图与常规建议口径。

## 12. 下一轮候选
- ChallengePage 趋势图增加更细的焦点态说明
- 首页挑战卡加入更细粒度的“何时停止继续冲榜”边界层级
- 继续拆分 `practice-store`，减少挑战与计划状态耦合
