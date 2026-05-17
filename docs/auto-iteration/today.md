# 今日自治迭代计划

## 1. 今日主线
集成 Vitest 代码覆盖率报告，配置覆盖率阈值，更新 CI/CD 流程以生成覆盖率报告。

## 2. 问题背景
当前项目已有 171 个测试用例，但缺乏代码覆盖率监控机制。无法直观看到哪些代码未被测试覆盖，容易引入未覆盖的逻辑导致无人值守迭代中的回归问题。

## 3. 根因判断
- 之前测试基线建立时未配置覆盖率
- vitest.config.js 中缺少 coverage 相关配置
- CI/CD 流程未集成覆盖率报告生成

## 4. 目标用户价值
- 提高代码质量，减少未覆盖逻辑导致的 bug
- 为无人值守迭代提供覆盖率指标参考
- 便于后续迭代时评估测试覆盖范围

## 5. 工程价值
- 完善测试体系，建立覆盖率基线
- 配置覆盖率阈值，防止覆盖率下降
- 为 CI/CD 增加覆盖率报告步骤

## 6. 涉及模块
- vitest.config.js（添加覆盖率配置）
- .github/workflows/ci.yml（添加覆盖率报告生成）
- package.json（可能添加 coverage 脚本）
- docs/auto-iteration/architecture.md（更新测试体系说明）

## 7. 非目标
- 不修改业务代码
- 不增加新测试用例（本次仅配置覆盖率）
- 不重构现有测试

## 8. 设计方案
### 覆盖率配置
1. 使用 Vitest 内置的 coverage 功能（基于 c8）
2. 配置覆盖率目录、报告格式（html、json、text）
3. 设置合理的覆盖率阈值（初期 60-70%）
4. 排除 node_modules、dist、docs 等目录

### CI/CD 集成
1. 在 GitHub Actions 中添加 npm run test:coverage 步骤
2. 上传覆盖率报告作为 artifact
3. 不要求覆盖率必须通过阈值（初期先收集数据）

## 9. 验收标准
- npm run test:coverage 能正常生成覆盖率报告
- 覆盖率报告在 dist/coverage 或 coverage/ 目录生成
- npm run build 通过
- npm test 仍通过所有测试
- CI/CD 流程中包含覆盖率步骤

## 10. 质量门禁
列出今天必须执行的命令：
1. npm install（确保依赖完整）
2. npm run build（确保构建正常）
3. npm test（确保所有测试通过）
4. npm run test:coverage（确保覆盖率报告生成）

## 11. 回滚策略
如果失败：
1. 使用 git reset --hard 回退到 main 分支当前状态
2. 更新 failure-log.md 记录失败原因
3. 更新 state.md 标记 rollback_required 为 true

## 12. 自动合并条件
必须写清楚：
- npm run build 必须通过
- npm test 必须通过
- npm run test:coverage 必须能生成报告
- 工作目录必须干净（无未提交更改）
