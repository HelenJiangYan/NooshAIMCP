import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage.js';
import { DashboardPage } from '../../src/pages/DashboardPage.js';
import { AIChatPage } from '../../src/pages/AIChatPage.js';

test.describe('NooshAI Chatbot', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let aiChatPage: AIChatPage;

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

  test('should display AI Assistant page after navigation', async ({ page }) => {
    // Verify we're on the AI Assistant page by checking URL and chat input
    await expect(page).toHaveURL(/.*chatbot.*/);
    await expect(aiChatPage.getChatInput()).toBeVisible();
  });

  test('should have chat input field', async () => {
    // Verify chat input is visible and enabled
    const chatInput = aiChatPage.getChatInput();
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });

  test('should respond to greeting message', async () => {
    // Send greeting
    await aiChatPage.sendMessage('Hello');
    await aiChatPage.waitForResponse();

    // Verify response is not empty
    await aiChatPage.expectResponseNotEmpty();
  });

  test('should respond to question about capabilities', async () => {
    // Ask about capabilities
    const response = await aiChatPage.chat('What can you help me with?');

    // Verify response exists
    expect(response.length).toBeGreaterThan(0);
  });

  test('should handle multiple messages in conversation', async () => {
    // First message
    await aiChatPage.sendMessage('Hello');
    await aiChatPage.waitForResponse();

    // Second message
    await aiChatPage.sendMessage('Tell me more');
    await aiChatPage.waitForResponse();

    // Verify we have responses
    await aiChatPage.expectResponseNotEmpty();
  });
});
