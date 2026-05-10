# 发布记录

---

## 2026-05-10

### 今日主线
每日状态巡检（非迭代日）。

### 合并分支
无（巡检日，main 无需合并）

### 用户可见变化
无直接用户可见变化。本次为日常巡检，确认项目状态稳定。

### 工程变化
- 确认仓库同步正常
- 确认构建和测试通过（npm install ✅, npm run build ✅, npm test ✅）
- 确认 main 分支稳定（commit: 468f84d）
- 安全检查通过（无密钥泄露）

### 删除的旧逻辑
无

### 验证结果
- npm install: ✅ 通过（180 packages）
- npm run build: ✅ 通过（3.49s, 301.48 kB）
- npm test: ✅ 通过（117 tests, 4 files）

### 已知遗留
无

### main commit
468f84d30de6ba87d75dd5de86def22cbca8807（无变更）

---

## 2026-05-09

### 今日主线
为 `useTypingSession` 核心 Hook 建立自动化测试基线（目标 20-30 个测试用例覆盖核心时序逻辑）。

### 合并分支
main（当前代码已在 main）

### 用户可见变化
无直接用户可见变化。本次更新建立了 useTypingSession 的自动化测试基线，为未来更安全的代码迭代奠定基础。

### 工程变化
- 新增 `src/engine/session-machine.js` - 抽取 useTypingSession 中的纯函数逻辑
- 新增 `src/engine/__tests__/session-machine.test.js` - 61 个测试用例
- 修改 `src/hooks/useTypingSession.jsx` - 使用抽取的纯函数
- 修改 `src/engine/index.js` - 导出新模块
- 修改 `vitest.config.js` - 扩展测试文件匹配

### 删除的旧逻辑
无

### 验证结果
- npm install: ✅ 通过（180 packages）
- npm run build: ✅ 通过（2.41s）
- npm test: ✅ 通过（117 tests, 4 files）

### 已知遗留
无

### main commit
c53a79f fix(auto): resolve quality gate failures and clean obsolete logic

---

## 版本 2.0.3

### 发布日期
待定

### 变更类型
待定

### 说明
等待下次迭代完成后更新。

---

## 版本 2.0.2

### 发布日期
2026-05-08

### 变更类型
devops

### 用户可见变化
无直接用户可见变化。本次更新建立了自动化 CI/CD 流水线。

### 技术变化
- 新增 `.github/workflows/ci.yml` GitHub Actions 配置文件
- 触发条件：push 到 main 分支 + pull request 合并到 main
- Pipeline 步骤：npm ci → npm run build → npm test

---

## 版本 2.0.1

### 发布日期
2026-05-08

### 变更类型
test

### 用户可见变化
无直接用户可见变化。本次更新建立了 engine 核心模块的自动化测试基线。

### 技术变化
- 引入 Vitest ^2.1.0 测试框架
- 新增 56 个测试用例覆盖 metrics、coach、insights 模块

---

## 版本 2.0.0

### 发布日期
2026-05-07

### 主要功能
- 双入口首页
- 训练工作台
- AI 文本状态管理
- 结果页反馈
- 教练建议兜底
- 成长洞察页
- 双语界面
- 本地持久化

---

## 版本记录格式

### 版本号格式
X.Y.Z

- X：重大版本更新，可能包含不兼容变更
- Y：次要功能更新，向后兼容
- Z：补丁修复，向后兼容
