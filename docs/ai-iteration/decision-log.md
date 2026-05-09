# 重要技术/产品决策记录

## 决策列表

### 2026-05-07 - 初始化自动化迭代基线

**决策类型**: 技术/流程

**决策内容**:
1. 创建 docs/ai-iteration/ 目录作为自动化迭代工作文档中心
2. 建立每日迭代流程：backlog → today → daily-report
3. 建立质量门禁：npm install + npm run build 必须通过
4. 当前不引入测试框架，采用人工回归清单作为过渡方案

**决策理由**:
- 项目当前处于快速迭代阶段，需要建立可追踪的迭代流程
- 测试框架引入需要时间和资源，当前优先保证构建稳定性
- 人工回归清单可以在短期内保证核心功能的稳定性

**负责人**: AI 迭代工程师

---

### 2026-05-07 - 安全约束规范

**决策类型**: 安全

**决策内容**:
1. AI_API_KEY 和 AI_API_URL 不提交到版本控制
2. config.js 文件保持在 .gitignore 中
3. Hash Router 路由保持不变
4. localStorage 数据格式保持向后兼容

**决策理由**:
- 保护敏感 API 密钥不被泄露
- 保持现有用户数据不丢失
- 保持现有 URL 路由兼容性

**负责人**: AI 迭代工程师

---

### 2026-05-07 - 双语言支持策略

**决策类型**: 产品

**决策内容**:
1. 继续保持中英文双语界面
2. 语言设置持久化到 localStorage
3. 新增文案必须同时提供中英文版本

**决策理由**:
- 产品面向全球用户，需要双语支持
- 保持用户体验一致性

**负责人**: AI 迭代工程师

---

### 2026-05-08 - 测试框架选型决策

**决策类型**: 技术/流程

**决策内容**:
1. 引入 Vitest ^2.1.0 作为测试框架（替代 2026-05-07 决策中"不引入测试框架"的决定）
2. 使用 node 环境作为 engine 模块的纯函数测试环境
3. 测试文件统一放置在 `src/engine/__tests__/` 目录
4. 测试配置通过 `vitest.config.js` 管理

**决策理由**:
- 项目已进入需要质量保障的阶段，engine 模块的纯函数适合建立测试基线
- Vitest 与 Vite 生态一致，配置简洁，性能优异
- 56 个测试用例覆盖 metrics、coach、insights 三个核心模块
- node 环境无需 DOM，避免 ESM/CJS 兼容性问题

**历史变更**:
- 2026-05-08 原始决策使用 jsdom ^29.1.1
- 2026-05-09 修正为 node 环境（jsdom v29.1.1 在 Node 18 CJS 环境下存在 @exodus/bytes ESM 兼容性 bug）

**覆盖范围**:
- metrics.js: calculateMetrics, calculateConsistency, collectErrorBreakdown, deriveComparison (28 tests)
- coach.js: buildLocalCoachAdvice (11 tests)
- insights.js: buildInsights (17 tests)

**负责人**: AI 迭代工程师

**状态**: 生效中

---

### 2026-05-08 - CI/CD 流水线选型决策

**决策类型**: 技术/流程

**决策内容**:
1. 引入 GitHub Actions 作为 CI/CD 流水线工具
2. 创建 `.github/workflows/ci.yml` 配置文件
3. 触发条件：push 到 main 分支 + pull request 合并到 main
4. Pipeline 步骤：npm ci → npm run build → npm test
5. Node.js 版本使用 18.x（与 package.json engines 一致）
6. 初始版本不包含部署步骤，保持手动部署

**决策理由**:
- GitHub Actions 与 GitHub 仓库原生集成，无需额外配置第三方服务
- 与 2026-05-08 建立的 Vitest 测试基线配套，形成完整自动化验证
- 简洁配置确保低维护成本，初始版本聚焦构建和测试验证
- 避免过早引入部署自动化，降低变更风险

**验证结果**:
- npm install: ✅ 通过
- npm run build: ✅ 通过
- npm test: ✅ 56 tests passed (after 2026-05-09 jsdom→node fix)

**负责人**: AI 迭代工程师

**状态**: 生效中

---

## 决策格式说明

每条决策应包含：
- 日期：决策制定日期
- 类型：技术/产品/安全/流程
- 内容：决策的具体内容
- 理由：做出该决策的原因
- 负责人：决策的负责人

## 决策状态

| 状态 | 说明 |
|------|------|
| 生效中 | 决策正在执行 |
| 已完成 | 决策已完全实施 |
| 已废弃 | 决策已被新决策取代 |