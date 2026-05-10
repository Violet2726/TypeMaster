# 下周架构治理路线

> 生成日期：2026-05-10
> 适用周期：2026-05-11 ~ 2026-05-16

---

## 1. 本周自动化总结

### 完成内容
- 2026-05-09: 完成 `useTypingSession 测试基线建立`
  - 新增 `src/engine/session-machine.js`（纯函数抽取）
  - 新增 `src/engine/__tests__/session-machine.test.js`（61 个测试用例）
  - engine 模块测试总数达到 117 个

### 质量门禁状态
| 检查项 | 状态 |
|--------|------|
| npm install | ✅ 180 packages |
| npm run build | ✅ 301.48 kB |
| npm test | ✅ 117 tests |

### 项目稳定性
- main 分支处于 STABLE 状态
- 无 active_branch
- 质量门禁全部通过

---

## 2. 反复出现的问题

### 问题排序（按频率 × 严重程度）

| 排名 | 问题 | 频率 | 严重度 | 根因分类 |
|------|------|------|--------|----------|
| P1 | storage.js 无测试保护 | 高 | 高 | 测试缺失 |
| P2 | i18n 单文件臃肿（566行） | 中 | 中 | 数据结构 |
| P3 | AI 服务错误归类逻辑无测试 | 中 | 中 | 测试缺失 |
| P4 | practice-store.jsx 职责过重（444行） | 中 | 中 | 模块边界 |

### 详细分析

#### P1: storage.js 无测试保护
- **位置**: `src/services/storage.js`
- **现象**: 无任何单元测试
- **风险**: localStorage 边界情况（QuotaExceededError、类型解析错误）无保护
- **修复价值**: 中等（无人值守合并可靠性的关键薄弱点）

#### P2: i18n 单文件臃肿
- **位置**: `src/i18n/index.js`
- **现象**: 566 行单文件，中英文文案硬编码在同一对象中
- **风险**: 新增文案时容易只改一处导致不同步；大型文件维护困难
- **历史**: 已有中英文文案不一致的潜在风险
- **修复价值**: 中等（长期可维护性）

#### P3: AI 服务错误归类逻辑无测试
- **位置**: `src/services/ai-service.js`
- **现象**: `normalizeThrownError`、`throwResponseError` 等函数无测试
- **风险**: AI 服务异常场景（timeout/network/empty_response）无覆盖
- **修复价值**: 中等（AI 训练工坊可靠性的薄弱点）

#### P4: practice-store.jsx 职责过重
- **位置**: `src/store/practice-store.jsx`
- **现象**: 444 行，包含配置管理、AI 状态、教练状态、历史持久化、UI 联动
- **风险**: 新增状态时容易堆叠；测试困难
- **历史**: 本周通过 `session-machine.js` 抽取缓解，但 store 本身仍需治理
- **修复价值**: 中等（可延后至下下周）

---

## 3. 根因分析

### 根因分布

```
测试缺失: 50% (P1, P3)
├─ storage.js 无测试
└─ ai-service.js 错误处理无测试

模块边界: 25% (P4)
└─ practice-store.jsx 职责过重

数据结构: 25% (P2)
└─ i18n 单文件臃肿
```

### 判断

1. **测试缺失是当前最大风险**：无人值守合并时，storage 和 AI 服务的边界情况最容易在非标准环境下触发失败。

2. **i18n 结构性问题已出现**：新增文案需要手动保持中英文同步，效率低且易出错。

3. **practice-store.jsx 需要拆分**：当前所有状态管理集中在一起，但已有 refactor-debt.md 记录，属于已知问题。

---

## 4. 下周最多三个重构主题

### 主题 A: storage.js 测试基线建立

#### 目标
为 `src/services/storage.js` 建立完整的单元测试覆盖，确保 localStorage 边界情况有保护。

#### 涉及模块
- `src/services/storage.js`
- 新增 `src/services/__tests__/storage.test.js`

#### 为什么必须重构
- storage 是无人值守场景下最容易暴露的模块（非标准浏览器、隐私模式、存储限制）
- 当前没有任何测试保护，任何 localStorage 异常都会导致静默失败
- 这与上周建立的 session-machine 测试基线形成对比：纯函数有测试，基础设施没有

#### 旧逻辑清理范围
- 不改动任何业务逻辑
- 仅添加测试覆盖以下场景：
  - `readJson`: 正常解析、空值、JSON 解析错误
  - `writeJson`: 正常写入、QuotaExceededError
  - `loadSettings`/`saveSettings`: 默认值合并
  - `appendSession`/`updateSession`: 边界裁剪
  - `appendCoachAdvice`/`getCoachAdviceBySessionId`: 查询正确性

#### 验收标准
- 新增测试文件覆盖 storage.js 100% 逻辑路径
- `npm test` 通过，117 + N tests
- `npm run build` 通过
- 不改变任何运行时行为

#### 风险
- 低风险：纯测试添加，不改变业务逻辑
- 需要 mock localStorage（在 node 环境）

#### 不做什么
- 不改动 storage.js 业务逻辑
- 不引入新的存储方案（如 IndexedDB）
- 不修改调用 storage 的上游组件

---

### 主题 B: ai-service.js 错误归类测试覆盖

#### 目标
为 `src/services/ai-service.js` 的错误处理路径建立测试覆盖。

#### 涉及模块
- `src/services/ai-service.js`
- 新增 `src/services/__tests__/ai-service.test.js`

#### 为什么必须重构
- AI 服务是外部依赖，失败场景多样（timeout/network/empty_response/server_error）
- `normalizeThrownError`、`throwResponseError` 等函数的错误归类逻辑无测试
- 上周建立的 session-machine 测试基线需要对齐：核心逻辑有测试，边界逻辑也要有

#### 旧逻辑清理范围
- 不改动任何 AI 请求逻辑
- 仅添加测试覆盖以下场景：
  - `AiServiceError` 类实例化
  - `normalizeThrownError`: TypeError/AbortError/AiServiceError/unknown
  - `cleanJsonText`: 正常/带 markdown 包裹/空字符串
  - `extractMessageContent`: text 格式/message.content 格式/message.content 数组格式
  - `normalizeCoachAdvicePayload`: 正常/缺失字段/语言切换

#### 验收标准
- 新增测试文件覆盖 ai-service.js 错误处理逻辑
- `npm test` 通过，117 + N tests
- `npm run build` 通过
- mock fetch 以支持 node 环境测试

#### 风险
- 低风险：纯测试添加
- 需要 mock globalThis.fetch

#### 不做什么
- 不改动 AI 请求的实际调用逻辑
- 不引入真实的 AI API 调用
- 不改动 generatePracticeText/generateCoachAdvice 的请求参数

---

### 主题 C: i18n 分层结构验证（不改动代码，验证方案）

#### 目标
评估 i18n 当前结构的维护成本，输出结构优化建议但不实施。

#### 涉及模块
- `src/i18n/index.js`
- 相关文档输出到 `docs/auto-iteration/i18n-refactor-proposal.md`

#### 为什么必须重构（评估）
- 566 行单文件，新增文案需要手动保持中英文同步
- 当前没有机制防止文案遗漏（如缺少字段时的 CI 检查）
- 长期维护风险：随着功能增加，文案同步成本会指数增长

#### 评估范围
1. 当前 i18n 结构分析（字段数量、语言版本差异检测）
2. 可能的分层方案：
   - 方案 A: 按页面拆分（home.js, practice.js, result.js, ...）
   - 方案 B: 按语言拆分目录（zh-CN/*.js, en-US/*.js）
   - 方案 C: 保持单文件，引入 CI 检查（如 jest-i18n-coverage）
3. 各方案优缺点对比
4. 不实施，仅输出建议文档

#### 验收标准
- 输出 `docs/auto-iteration/i18n-refactor-proposal.md`
- 包含结构分析、方案对比、推荐路径
- 不修改任何源代码

#### 风险
- 无风险：纯调研和文档输出

#### 不做什么
- 不拆分 i18n 文件
- 不引入新的 i18n 库
- 不添加 CI 检查脚本

---

## 5. 禁止补丁清单

以下场景 **不允许继续局部修补**，必须进入重构：

| 场景 | 原因 | 正确的修复方式 |
|------|------|---------------|
| storage.js 新增字段需要默认值 | 无测试保护，修补容易遗漏边界情况 | 主题 A：添加对应测试 |
| ai-service.js 新增错误码处理 | 错误归类逻辑无测试，修补后无法验证 | 主题 B：添加错误处理测试 |
| i18n 新增页面文案 | 手动同步中英文容易遗漏 | 主题 C 验证后，制定分层方案 |
| practice-store.jsx 新增状态 | 职责已过重，继续堆叠难以维护 | 等待主题 A/B 完成后评估拆分 |
| 在已有测试覆盖的模块上打补丁 | 破坏测试覆盖完整性 | 必须同步更新测试 |

---

## 6. 自动化测试补强建议

### 最能提升无人值守合并可靠性的测试

#### 优先级 1: storage.js 测试（本周主题 A）
- **原因**: localStorage 在非标准环境下（隐私模式、存储满、不同域）行为不一致
- **预期收益**: 防止静默失败，提升数据持久化可靠性
- **影响范围**: 覆盖 practice-store.jsx 的数据层

#### 优先级 2: ai-service.js 错误处理测试（本周主题 B）
- **原因**: AI 服务是外部依赖，失败场景多样
- **预期收益**: 防止 AI 异常蔓延到 UI 层
- **影响范围**: 覆盖 PracticePage、ResultPage 的 AI 训练闭环

#### 优先级 3: i18n 完整性检查（长期）
- **原因**: 文案遗漏会导致用户看到 undefined/null
- **预期收益**: CI 级别检查，发现文案遗漏
- **方案**: 引入 `i18next-parser` + CI diff 检查，或自定义 jest 插件

### 测试策略原则

1. **engine 模块**: 纯函数优先，已有良好测试基线（117 tests）
2. **services 模块**: 依赖外部资源（localStorage/API），需要 mock
3. **store 模块**: 组合逻辑，可通过 engine + services 测试间接覆盖
4. **components 模块**: 渲染测试 ROI 低，优先保证下层测试

---

## 附录：本周不作为默认路线的功能

以下功能 **不是** 本周的重构主题（即使在 backlog 中有记录）：

- 账号系统（需要后端基础设施）
- 跨设备同步（依赖账号系统）
- 挑战机制（产品功能，非架构优先级）
- bundle 性能优化（已有 P0 标识但需更多数据支撑）
- TypeScript 迁移（重大工程，需要专门周期）

这些功能如果被提出，将作为 P2/P3 任务进入 backlog，不影响本周的三个重构主题。
