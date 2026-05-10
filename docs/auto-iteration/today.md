# 今日自治迭代计划

## 1. 今日主线
为 storage.js 建立完整的单元测试基线，覆盖 localStorage 边界情况。

## 2. 问题背景
当前项目中，storage.js 负责读写用户设置、练习历史和教练建议，但该模块没有任何自动化测试。在无人值守迭代场景下，localStorage 的边界情况（如 JSON 解析错误、QuotaExceededError、类型不匹配）可能导致静默失败，影响用户体验和数据一致性。

## 3. 根因判断
测试体系缺口：虽然 engine/ 模块已有 117 个测试用例，但 services/ 层（storage.js、ai-service.js）完全没有测试覆盖。

## 4. 目标用户价值
- 防止 localStorage 异常导致整个应用崩溃
- 保证历史数据和设置的读写安全
- 提升无人值守迭代的稳定性

## 5. 工程价值
- 建立 services/ 层测试基线
- 为后续 ai-service.js 测试提供参考模式
- 降低无人值守迭代的风险

## 6. 涉及模块
- src/services/storage.js（被测试对象）
- src/engine/__tests__/ 或新建 src/services/__tests__/ 目录
- vitest.config.js（可能需要扩展测试文件匹配）

## 7. 非目标
- 不修改 storage.js 的业务逻辑（除非发现 bug）
- 不添加新的 storage 功能
- 不涉及 ai-service.js 测试（留待下次迭代）

## 8. 设计方案

### 测试覆盖范围
1. 基础读写测试：
   - loadSettings()：读取默认值、读取已保存值、合并缺失字段
   - saveSettings()：写入成功、写入失败（吞掉异常）
2. JSON 解析边界测试：
   - localStorage 中存了无效 JSON 时回退默认值
   - localStorage 中存了 null/undefined 时回退默认值
3. 会话管理测试：
   - appendSession()：追加记录、裁剪到 50 条
   - updateSession()：更新指定 session
   - loadSessions()/saveSessions()：读写列表
4. 教练建议管理测试：
   - appendCoachAdvice()：追加记录、裁剪到 50 条
   - getCoachAdviceBySessionId()：查询指定记录

### 测试实现方案
- 使用 Vitest 的 vi.spyOn 模拟 window.localStorage
- 在 node 环境测试（模拟 localStorage）
- 测试文件位置：src/services/__tests__/storage.test.js
- 测试环境配置：vitest.config.js 扩展 include 规则

## 9. 验收标准
- npm run build 成功通过
- npm test 成功通过，新增至少 15 个测试用例
- storage.js 测试覆盖率达到 80% 以上
- 所有边界情况测试通过
- 无回归测试失败

## 10. 质量门禁
列出今天必须执行的命令：
1. npm install（确保依赖完整）
2. npm run build（确保构建正常）
3. npm test（确保所有测试通过）

## 11. 回滚策略
如果失败：
1. 使用 git reset --hard 回退到 main 分支当前状态
2. 更新 failure-log.md 记录失败原因
3. 更新 state.md 标记 rollback_required 为 true

## 12. 自动合并条件
必须写清楚：
- npm run build 必须通过
- npm test 必须通过（包括新增测试）
- 工作目录必须干净（无未提交更改）
- 必须删除临时文件（如果有）
