# 每日执行任务

## 今日日期
2026-05-08

---

## 今日任务：为 engine 核心模块建立单元测试基线

### 背景问题
TypeMaster 目前没有任何自动化测试覆盖。`src/engine/` 目录包含核心的纯函数逻辑（WPM 计算、准确率统计、教练建议生成等），这些逻辑是产品体验的基础，但目前依赖人工验证，存在回归风险。

### 用户价值
- 为后续迭代提供质量保障，避免修改 engine 时引入回归 bug
- 作为测试基线，让贡献者有信心重构和优化代码
- 文档化 engine 模块的预期行为

### 涉及文件
- **新增**: `src/engine/__tests__/metrics.test.js` - metrics 模块单元测试
- **新增**: `src/engine/__tests__/coach.test.js` - coach 模块单元测试
- **新增**: `src/engine/__tests__/insights.test.js` - insights 模块单元测试
- **修改**: `package.json` - 添加测试脚本和依赖（如需要）

### 非目标（今天明确不做）
- 不测试 UI 组件（components/、pages/）
- 不测试异步逻辑（services/ai-service.js）
- 不测试 React Hooks（hooks/）
- 不引入 E2E 测试
- 不修改 src/ 下的业务代码逻辑
- 不追求 100% 覆盖率，优先覆盖核心路径

### 验收标准
- [ ] 测试框架配置完成（优先使用 Vitest，与 Vite 生态一致）
- [ ] `metrics.js` 核心函数有基础测试覆盖：
  - `calculateMetrics` - 基本输入输出验证
  - `calculateConsistency` - 稳定度计算验证
  - `collectErrorBreakdown` - 错误字符/单词统计验证
  - `deriveComparison` - 历史对比验证
- [ ] `coach.js` 核心函数有基础测试覆盖：
  - `buildLocalCoachAdvice` - 本地教练建议生成验证
- [ ] `insights.js` 核心函数有基础测试覆盖：
  - `buildInsights` - 洞察数据构建验证
- [ ] `npm run test` 命令可正常运行
- [ ] 所有测试通过
- [ ] `npm run build` 仍然通过（测试不影响构建）

### 测试/构建命令
```bash
# 安装测试依赖
npm install -D vitest

# 运行测试
npm run test

# 运行测试（带覆盖率）
npm run test:coverage

# 验证构建不受影响
npm run build
```

### 风险点
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Vitest 与现有 Vite 配置冲突 | 低 | 中 | 使用官方推荐配置，逐步引入 |
| 测试用例设计不当导致维护困难 | 中 | 低 | 保持测试简单，聚焦输入输出 |
| 测试依赖影响生产构建 | 低 | 高 | 确保 devDependencies 正确配置 |

### 回滚方式
1. 删除 `src/engine/__tests__/` 目录
2. 从 `package.json` 中移除测试相关依赖和脚本
3. 恢复 `package.json` 的原始状态

---

## 历史记录

### 2026-05-07 - 自动化迭代基线初始化
已完成：
- 项目结构熟悉
- 创建 docs/ai-iteration/ 目录结构
- 创建基础迭代文档
- 运行 npm install 和 npm run build 验证
