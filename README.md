# NooshAI Chatbot E2E Test Framework

基于 Playwright 的 NooshAI Chatbot 端到端测试框架，集成 MCP (Model Context Protocol) 进行 AI 响应验证。

## 项目结构

```
NooshAIMCP/
├── src/
│   ├── pages/                    # Page Object Model
│   │   ├── LoginPage.ts          # 登录页面
│   │   ├── DashboardPage.ts      # 仪表板页面
│   │   └── AIChatPage.ts         # AI 聊天页面
│   ├── mcp/                      # MCP 服务器
│   │   ├── chatbot-validator-server.ts  # 验证服务器
│   │   └── chatbot-validator-client.ts  # 验证客户端
│   └── test-data/
│       └── conversation-scenarios.ts    # 多轮对话测试数据
├── tests/
│   └── ai-assistant/
│       ├── chatbot.spec.ts              # 基础聊天测试
│       ├── chatbot-mcp.spec.ts          # MCP 验证测试
│       └── multi-turn-conversation.spec.ts  # 多轮对话测试
├── .env.example                  # 环境变量示例
├── playwright.config.ts          # Playwright 配置
└── package.json
```

## 安装

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install
```

## 配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入测试凭据：
```
TEST_USERNAME=your_username
TEST_PASSWORD=your_password
BASE_URL=https://nooshchat.qa2.noosh.com
AUTH_URL=https://nooshauth.qa2.noosh.com/login
```

## 运行测试

```bash
# 编译 TypeScript
npm run build

# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/ai-assistant/chatbot-mcp.spec.ts

# 带界面运行 (headed mode)
npx playwright test --headed

# 运行特定测试
npx playwright test --grep "greeting response"

# 查看测试报告
npx playwright show-report
```

## 测试场景

### 基础功能测试 (chatbot-mcp.spec.ts)
- 问候响应验证
- 项目搜索功能
- 创建项目功能
- 对话上下文保持
- 创建草稿订单
- MCP 工具列表验证

### 多轮对话测试 (multi-turn-conversation.spec.ts)
使用 `conversation-scenarios.ts` 中定义的场景数据：

| 测试类别 | 描述 |
|---------|------|
| Context Continuity | 上下文连续性测试 |
| Logic Consistency | 逻辑一致性测试 |
| Context Switching | 上下文切换测试 |
| Error Recovery | 错误恢复测试 |
| Complex Conversations | 复杂对话流程测试 |

## NooshAI Chatbot 支持的功能

- **Create Project** - 创建项目
- **Copy Project** - 复制项目
- **Search Project** - 搜索项目
- **Create Draft Order** - 创建草稿订单
- **Reorder** - 重新订购

## MCP 验证工具

MCP 服务器提供以下验证工具：

| 工具名称 | 描述 |
|---------|------|
| `validate_response_pattern` | 正则表达式模式验证 |
| `validate_response_keywords` | 关键词验证 |
| `validate_response_length` | 响应长度验证 |
| `validate_response_not_error` | 错误检测验证 |
| `validate_chatbot_response` | 综合验证 |

## 技术栈

- **Playwright** - E2E 测试框架
- **TypeScript** - 类型安全
- **MCP (Model Context Protocol)** - AI 响应验证
- **Page Object Model** - 测试架构模式

## 开发

```bash
# 监听模式编译
npm run build -- --watch

# 调试模式运行测试
npx playwright test --debug

# UI 模式运行测试
npx playwright test --ui
```

## License

MIT
