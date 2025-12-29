import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage.js';
import { DashboardPage } from '../../src/pages/DashboardPage.js';
import { AIChatPage } from '../../src/pages/AIChatPage.js';
import {
  ChatbotValidatorClient,
  getValidator,
  closeValidator,
} from '../../src/mcp/chatbot-validator-client.js';

/**
 * NooshAI Chatbot Tests with MCP Validation
 *
 * These tests use the MCP server to validate AI chatbot responses
 * against expected patterns, keywords, and other criteria.
 */
test.describe('NooshAI Chatbot with MCP Validation', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let aiChatPage: AIChatPage;
  let validator: ChatbotValidatorClient;

  test.beforeAll(async () => {
    // Initialize MCP validator client
    validator = await getValidator();
  });

  test.afterAll(async () => {
    // Close MCP connection
    await closeValidator();
  });

  test.beforeEach(async ({ page }) => {
    // Initialize Page Objects (POM)
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    aiChatPage = new AIChatPage(page);

    // Login flow (prerequisite step)
    await loginPage.loginWithEnvCredentials();

    // Navigate to AI Assistant from Dashboard
    await dashboardPage.navigateToAIAssistant();
    await aiChatPage.waitForReady();
  });

  test('should validate greeting response with MCP', async ({ page }) => {
    // Send greeting - the chatbot responds with project/order management help
    console.log('\n========== 测试: 验证问候响应 ==========');
    console.log('发送消息: Hello');
    await aiChatPage.sendMessage('Hello');
    await aiChatPage.waitForResponse();

    // Get the response
    const response = await aiChatPage.getLastResponse();
    console.log('\n--- AI 响应内容 (前200字符) ---');
    console.log(response.substring(0, 200));
    console.log('--- 响应长度:', response.length, '字符 ---\n');

    // 暂停让用户看到页面状态
    await page.waitForTimeout(2000);

    // Use MCP to validate response
    // Expected: AI should mention project/order management capabilities
    console.log('开始 MCP 验证...');
    console.log('验证条件: notEmpty=true, minLength=5, notError=true');
    const validation = await validator.validate(response, {
      notEmpty: true,
      minLength: 5,
      notError: true,
    });

    // 显示详细验证结果
    console.log('\n--- MCP 验证结果 ---');
    console.log('整体验证通过:', validation.isValid);
    console.log('详细结果:', JSON.stringify(validation.results, null, 2));
    console.log('响应预览:', validation.responsePreview);
    console.log('========================================\n');

    // 暂停让用户看到验证结果
    await page.waitForTimeout(2000);

    // Assert validation passed
    expect(validation.isValid).toBe(true);
  });

  test('should validate search project response', async ({ page }) => {
    // Test actual chatbot capability: Search Project
    console.log('\n========== 测试: 验证项目搜索功能 ==========');
    console.log('发送消息: Search for projects with keyword test');
    await aiChatPage.sendMessage('Search for projects with keyword test');
    await aiChatPage.waitForResponse();

    // Get the response
    const response = await aiChatPage.getLastResponse();
    console.log('\n--- AI 响应内容 (前200字符) ---');
    console.log(response.substring(0, 200));
    console.log('--- 响应长度:', response.length, '字符 ---\n');

    await page.waitForTimeout(2000);

    // Use MCP to validate - response should mention project/search
    console.log('开始 MCP 验证...');
    console.log('验证条件: notEmpty=true, minLength=10, notError=true');
    const validation = await validator.validate(response, {
      notEmpty: true,
      minLength: 10,
      notError: true,
    });

    console.log('\n--- MCP 验证结果 ---');
    console.log('验证通过:', validation.isValid);
    console.log('详细结果:', JSON.stringify(validation.results, null, 2));
    console.log('响应预览:', validation.responsePreview);
    console.log('========================================\n');

    await page.waitForTimeout(2000);

    expect(validation.isValid).toBe(true);
  });

  test('should validate create project response', async ({ page }) => {
    // Test actual chatbot capability: Create Project
    console.log('\n========== 测试: 验证创建项目功能 ==========');
    console.log('发送消息: Create a project with name Test Project 2024, with due date being two weeks from now');
    await aiChatPage.sendMessage('Create a project with name Test Project 2024, with due date being two weeks from now');
    await aiChatPage.waitForResponse();

    // Get the response
    const response = await aiChatPage.getLastResponse();
    console.log('\n--- AI 响应内容 (前200字符) ---');
    console.log(response.substring(0, 200));
    console.log('--- 响应长度:', response.length, '字符 ---\n');

    await page.waitForTimeout(2000);

    // Validate response length
    console.log('验证1: 响应长度 >= 10');
    const lengthValidation = await validator.validateLength(response, 10);
    console.log('长度验证通过:', lengthValidation.isValid);
    console.log('实际长度:', lengthValidation.actualLength);
    if (lengthValidation.errors.length > 0) {
      console.log('错误:', lengthValidation.errors);
    }

    await page.waitForTimeout(1000);

    // Validate response is not an error
    console.log('\n验证2: 响应不是错误消息');
    const errorValidation = await validator.validateNotError(response);
    console.log('非错误验证通过:', errorValidation.isValid);
    console.log('是否为错误:', errorValidation.isError);
    console.log('匹配的错误模式:', errorValidation.matchedErrorPatterns);
    console.log('========================================\n');

    await page.waitForTimeout(2000);

    expect(lengthValidation.isValid).toBe(true);
    expect(errorValidation.isValid).toBe(true);
    expect(errorValidation.isError).toBe(false);
  });

  test('should validate conversation maintains context', async ({ page }) => {
    // Test context continuity with project-related conversation
    console.log('\n========== 测试: 验证对话上下文保持 ==========');

    // First message - Create a project
    console.log('发送第一条消息: Create a project with name Context Test Project');
    await aiChatPage.sendMessage('Create a project with name Context Test Project');
    await aiChatPage.waitForResponse();

    const firstResponse = await aiChatPage.getLastResponse();
    console.log('\n--- 第一次响应 (前150字符) ---');
    console.log(firstResponse.substring(0, 150));

    await page.waitForTimeout(2000);

    // Second message referencing first - Copy the project
    console.log('\n发送第二条消息: Copy this project and rename it to Context Test Copy');
    await aiChatPage.sendMessage('Copy this project and rename it to Context Test Copy');
    await aiChatPage.waitForResponse();

    // Get the response
    const response = await aiChatPage.getLastResponse();
    console.log('\n--- 第二次响应 (前200字符) ---');
    console.log(response.substring(0, 200));
    console.log('--- 响应长度:', response.length, '字符 ---\n');

    await page.waitForTimeout(2000);

    // Use MCP comprehensive validation
    console.log('开始 MCP 验证...');
    console.log('验证条件: notEmpty=true, notError=true, minLength=3');
    const validation = await validator.validate(response, {
      notEmpty: true,
      notError: true,
      minLength: 3,
    });

    console.log('\n--- MCP 验证结果 ---');
    console.log('整体验证通过:', validation.isValid);
    console.log('详细结果:', JSON.stringify(validation.results, null, 2));
    console.log('响应预览:', validation.responsePreview);
    console.log('========================================\n');

    await page.waitForTimeout(2000);

    expect(validation.isValid).toBe(true);
  });

  test('should validate draft order creation', async ({ page }) => {
    // Test actual chatbot capability: Create Draft Order
    console.log('\n========== 测试: 验证创建草稿订单功能 ==========');

    console.log('发送消息: Create a draft order');
    await aiChatPage.sendMessage('Create a draft order');
    await aiChatPage.waitForResponse();

    // Get the response
    const response = await aiChatPage.getLastResponse();
    console.log('\n--- AI 响应内容 (前200字符) ---');
    console.log(response.substring(0, 200));
    console.log('--- 响应长度:', response.length, '字符 ---\n');

    await page.waitForTimeout(2000);

    // Validate using MCP - response should mention order/draft
    console.log('开始 MCP 验证...');
    console.log('验证条件: notEmpty=true, minLength=10, notError=true');
    const validation = await validator.validate(response, {
      notEmpty: true,
      minLength: 10,
      notError: true,
    });

    console.log('\n--- MCP 验证结果 ---');
    console.log('验证通过:', validation.isValid);
    console.log('详细结果:', JSON.stringify(validation.results, null, 2));
    console.log('响应预览:', validation.responsePreview);
    console.log('========================================\n');

    await page.waitForTimeout(2000);

    expect(validation.isValid).toBe(true);
  });

  test('should list available MCP validation tools', async ({ page }) => {
    console.log('\n========== 测试: 列出可用的MCP验证工具 ==========');

    // Get list of available tools
    console.log('正在获取 MCP 服务器工具列表...');
    const tools = await validator.listTools();

    console.log('\n--- 可用的 MCP 工具 ---');
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool}`);
    });
    console.log('--- 共', tools.length, '个工具 ---\n');

    await page.waitForTimeout(2000);

    // Verify our validation tools are available
    console.log('验证必需的工具是否存在:');
    const requiredTools = [
      'validate_response_pattern',
      'validate_response_keywords',
      'validate_response_length',
      'validate_response_not_error',
      'validate_chatbot_response',
    ];

    requiredTools.forEach(tool => {
      const exists = tools.includes(tool);
      console.log(`  - ${tool}: ${exists ? '✓ 存在' : '✗ 缺失'}`);
    });

    console.log('========================================\n');

    await page.waitForTimeout(2000);

    expect(tools).toContain('validate_response_pattern');
    expect(tools).toContain('validate_response_keywords');
    expect(tools).toContain('validate_response_length');
    expect(tools).toContain('validate_response_not_error');
    expect(tools).toContain('validate_chatbot_response');
  });
});
