# 今日自治迭代计划

## 1. 今日主线
代码覆盖率监控集成

## 2. 问题背景
当前项目已有 171 个测试用例，但无覆盖率报告，无法发现测试遗漏。新增代码可能缺少测试覆盖，无人值守合并时无法验证。

## 3. 根因判断
技术缺口 - 缺少 Vitest 覆盖率工具集成

## 4. 目标用户价值
间接提升产品质量，通过覆盖率发现测试缺失，降低未来回归风险

## 5. 工程价值
为无人值守合并提供更严格的质量保障，建立测试覆盖基线

## 6. 涉及模块
- vitest.config.js - 覆盖率配置
- package.json - 依赖与脚本
- .gitignore - 忽略覆盖率目录

## 7. 非目标
- 不提升覆盖率到 100%，仅建立基础设施
- 不修改现有测试
- 不修改业务代码

## 8. 设计方案
- 使用 @vitest/coverage-v8 作为覆盖率工具
- 配置阈值: 70% (statements/lines/functions), 50% (branches)
- 覆盖范围: src/engine, src/hooks, src/services
- 添加 coverage/ 到 .gitignore

## 9. 验收标准
- npm run build 成功通过
- npm test 成功通过
- npm run test:coverage 成功生成覆盖率报告
- vitest.config.js 包含 coverage 配置
- .gitignore 包含 coverage/
- package.json 包含 @vitest/coverage-v8 依赖

## 10. 质量门禁
- npm install
- npm run build
- npm test
- npm run test:coverage

## 11. 回滚策略
如失败，执行 git reset --hard origin/main 即可

## 12. 自动合并条件
- 所有质量门禁通过
- 无未提交改动
- 验收标准全部满足
