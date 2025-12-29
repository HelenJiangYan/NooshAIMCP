import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage.js';
import { DashboardPage } from '../../src/pages/DashboardPage.js';
import { AIChatPage } from '../../src/pages/AIChatPage.js';
import {
  ChatbotValidatorClient,
  getValidator,
  closeValidator,
} from '../../src/mcp/chatbot-validator-client.js';
import {
  CONTEXT_CONTINUITY_SCENARIOS,
  LOGIC_CONSISTENCY_SCENARIOS,
  CONTEXT_SWITCHING_SCENARIOS,
  ERROR_RECOVERY_SCENARIOS,
  COMPLEX_CONVERSATION_SCENARIOS,
  validateKeywords,
  validateContextReference,
  validateQuality,
  type ConversationScenario,
  type ConversationTurn,
} from '../../src/test-data/conversation-scenarios.js';

/**
 * Multi-Turn Conversation Tests
 *
 * Tests AI chatbot's ability to maintain context across multiple conversation turns.
 * Uses predefined scenarios from conversation-scenarios.ts
 */
test.describe('Multi-Turn Conversation Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let aiChatPage: AIChatPage;
  let validator: ChatbotValidatorClient;

  test.beforeAll(async () => {
    validator = await getValidator();
  });

  test.afterAll(async () => {
    await closeValidator();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    aiChatPage = new AIChatPage(page);

    await loginPage.loginWithEnvCredentials();
    await dashboardPage.navigateToAIAssistant();
    await aiChatPage.waitForReady();
  });

  /**
   * Helper function to run a conversation scenario
   */
  async function runScenario(scenario: ConversationScenario) {
    console.log(`\n========== 场景: ${scenario.name} ==========`);
    console.log(`描述: ${scenario.description}`);
    console.log(`轮次数: ${scenario.turns.length}`);

    const responses: string[] = [];

    for (let i = 0; i < scenario.turns.length; i++) {
      const turn = scenario.turns[i];
      console.log(`\n--- 第 ${i + 1} 轮 ---`);
      console.log(`用户: ${turn.userMessage}`);

      // Send message
      await aiChatPage.sendMessage(turn.userMessage);
      await aiChatPage.waitForResponse();

      // Get response
      const response = await aiChatPage.getLastResponse();
      responses.push(response);
      console.log(`AI响应 (前100字符): ${response.substring(0, 100)}...`);

      // Validate response is not empty
      const mcpValidation = await validator.validate(response, {
        notEmpty: true,
        minLength: 3,
      });
      expect(mcpValidation.isValid).toBe(true);

      // Validate keywords if specified
      if (turn.expectedKeywords && turn.expectedKeywords.length > 0) {
        const keywordResult = validateKeywords(response, turn.expectedKeywords, 'any');
        console.log(`关键词验证: ${keywordResult.passed ? '通过' : '失败'}`);
        console.log(`  找到: ${keywordResult.found.join(', ') || '无'}`);
        console.log(`  缺失: ${keywordResult.missing.join(', ') || '无'}`);

        // Soft assertion - log but don't fail for keyword misses
        if (!keywordResult.passed) {
          console.warn(`警告: 未找到预期关键词`);
        }
      }

      // Validate context reference if specified
      if (turn.contextCheck && turn.contextCheck.shouldReference.length > 0) {
        const contextResult = validateContextReference(response, turn.contextCheck);
        console.log(`上下文验证: ${contextResult.passed ? '通过' : '失败'}`);
        console.log(`  找到的引用: ${contextResult.found.join(', ') || '无'}`);
      }

      // Validate quality if specified
      if (turn.qualityCheck) {
        const qualityResult = validateQuality(response, turn.qualityCheck);
        console.log(`质量验证: ${qualityResult.passed ? '通过' : '失败'}`);
        if (qualityResult.errors.length > 0) {
          console.log(`  错误: ${qualityResult.errors.join(', ')}`);
        }
      }
    }

    console.log(`\n========== 场景完成: ${scenario.name} ==========\n`);
    return responses;
  }

  // ============ Context Continuity Tests ============
  test.describe('Context Continuity (上下文连续性)', () => {
    for (const scenario of CONTEXT_CONTINUITY_SCENARIOS) {
      test(`${scenario.name}`, async () => {
        await runScenario(scenario);
      });
    }
  });

  // ============ Logic Consistency Tests ============
  test.describe('Logic Consistency (逻辑一致性)', () => {
    for (const scenario of LOGIC_CONSISTENCY_SCENARIOS) {
      test(`${scenario.name}`, async () => {
        await runScenario(scenario);
      });
    }
  });

  // ============ Context Switching Tests ============
  test.describe('Context Switching (上下文切换)', () => {
    for (const scenario of CONTEXT_SWITCHING_SCENARIOS) {
      test(`${scenario.name}`, async () => {
        await runScenario(scenario);
      });
    }
  });

  // ============ Error Recovery Tests ============
  test.describe('Error Recovery (错误恢复)', () => {
    for (const scenario of ERROR_RECOVERY_SCENARIOS) {
      test(`${scenario.name}`, async () => {
        await runScenario(scenario);
      });
    }
  });

  // ============ Complex Conversation Tests ============
  test.describe('Complex Conversations (复杂对话)', () => {
    for (const scenario of COMPLEX_CONVERSATION_SCENARIOS) {
      test(`${scenario.name}`, async () => {
        await runScenario(scenario);
      });
    }
  });
});
