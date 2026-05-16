# 今日自治迭代计划

## 1. 今日主线
建立 ai-service.js 测试基线，覆盖错误归类、Payload 解析和边界情况。

## 2. 问题背景
当前项目中 ai-service.js 是核心服务层，负责 AI 文本生成和教练建议生成，但没有任何单元测试。这导致无人值守迭代中 AI 服务的错误处理、Payload 解析逻辑没有质量保障，容易引入回归问题。

## 3. 根因判断
- ai-service.js 中包含大量纯函数逻辑（错误归类、Payload 提取、JSON 清理等），非常适合单元测试
- 之前迭代重点放在 engine 模块和 storage.js，还未覆盖 services 层
- 缺乏测试会导致 AI 服务异常场景（超时、网络错误、无效响应等）没有验证

## 4. 目标用户价值
- 提升 AI 服务的稳定性，减少无人值守迭代中的故障
- 确保错误归类逻辑正确，用户能看到明确的错误提示
- 保障教练建议 Payload 解析的可靠性

## 5. 工程价值
- 完善测试覆盖，建立 services 层测试基线
- 提高代码可维护性，便于后续重构
- 符合无人值守迭代的质量要求

## 6. 涉及模块
- src/services/ai-service.js（测试对象）
- src/services/__tests__/ai-service.test.js（新增测试文件）
- vitest.config.js（已包含 services 测试，无需修改）

## 7. 非目标
- 不修改 ai-service.js 的业务逻辑
- 不实现新功能
- 不重构代码（除非为了测试可访问性，但本次保持原样）

## 8. 设计方案
### 测试覆盖范围
1. **AiServiceError 类测试**
   - 构造函数参数（code、message、options）
   - name 属性正确
   - status 和 cause 属性正确传递

2. **cleanJsonText 函数测试**
   - 普通文本直接返回
   - markdown 代码块包裹的 JSON 清理
   - 空字符串处理
   - 只有 ``` 的边界情况

3. **extractMessageContent 函数测试**
   - 不同 API 响应格式（choices[0].text、choices[0].message.content、choices[0].message.content 数组）
   - 空 payload 处理
   - 无效 choices 处理

4. **normalizeThrownError 函数测试**
   - AiServiceError 直接返回
   - AbortError 转换为 timeout 错误
   - TypeError 转换为 network 错误
   - 其他错误转换为 unknown 错误

5. **normalizeCoachAdvicePayload 函数测试**
   - 完整有效 payload
   - 部分缺失字段的 payload
   - 无效 JSON 字符串
   - 中英文语言切换

6. **throwResponseError 函数测试**
   - 不同状态码的响应
   - 包含 "Missing AI_API_KEY" 的响应
   - 响应文本为空的情况

### 测试环境
- 使用 Vitest 的 node 环境
- 不依赖 DOM
- 使用 vi.mock 模拟 fetch（如需要）

## 9. 验收标准
- npm run build 成功通过
- npm test 成功通过
- 新增测试数量 ≥ 20
- 覆盖所有纯函数逻辑
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
- npm test 必须通过
- 工作目录必须干净（无未提交更改）
- 必须删除临时文件（如果有）
