# 今日自治迭代计划

## 1. 今日主线
代码覆盖率监控集成

## 2. 问题背景
项目已有完整的测试基线（171个测试用例），但缺少代码覆盖率监控和报告生成机制。

## 3. 根因判断
- vitest.config.js 中未配置 coverage 选项
- CI 流程中未生成和上传覆盖率报告

## 4. 目标用户价值
- 可视化测试覆盖范围
- 帮助识别未测试的代码路径
- 提高代码质量和稳定性

## 5. 工程价值
- 建立覆盖率监控基线
- 为未来测试优化提供数据支持
- 符合现代前端开发最佳实践

## 6. 涉及模块
- vitest.config.js（覆盖率配置）
- .github/workflows/ci.yml（CI 覆盖率步骤）
- package.json（测试脚本）
- docs/auto-iteration/（相关文档更新）

## 7. 非目标
- 不重构现有业务逻辑
- 不新增功能
- 不强制要求 100% 覆盖率

## 8. 设计方案
### 优化方向
1. **配置 vitest 覆盖率**：添加 @vitest/coverage-v8 依赖，配置覆盖率报告
2. **更新 CI 流程**：在 GitHub Actions 中生成覆盖率报告
3. **更新 package.json**：添加 coverage 脚本
4. **更新文档**：记录覆盖率集成过程

## 9. 验收标准
- npm run test:coverage 成功生成覆盖率报告
- npm test 仍然通过（171个测试用例）
- npm run build 成功通过
- CI 流程中正常执行覆盖率步骤

## 10. 质量门禁
列出今天必须执行的命令：
1. npm install（确保依赖完整）
2. npm run test:coverage（确保覆盖率报告生成）
3. npm run build（确保构建正常）
4. npm test（确保所有测试通过）

## 11. 回滚策略
如果失败：
1. 使用 git reset --hard 回退到 main 分支当前状态
2. 更新 failure-log.md 记录失败原因
3. 更新 state.md 标记 rollback_required 为 true

## 12. 自动合并条件
必须写清楚：
- npm run build 必须通过
- npm test 必须通过
- npm run test:coverage 必须通过
- 工作目录必须干净（无未提交改动）
- 必须删除临时文件（如果有）
