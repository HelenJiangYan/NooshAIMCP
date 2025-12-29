import { Page } from '@playwright/test';

/**
 * DashboardPage - Page Object Model for NooshAI Dashboard
 *
 * Handles navigation to different sections of the application
 * from the main dashboard/workspace.
 */
export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to AI Assistant (Agentic Noosh) from dashboard
   * Clicks the Agentic Noosh link in the sidebar navigation
   */
  async navigateToAIAssistant() {
    // Wait for page to be ready
    await this.page.waitForLoadState('networkidle');

    // Check if we're already on the chatbot page
    if (this.page.url().includes('/workspace/chatbot')) {
      return;
    }

    // Click Agentic Noosh link in navigation
    const aiAssistantLink = this.page.getByRole('link', { name: /Agentic Noosh/i });
    await aiAssistantLink.waitFor({ state: 'visible', timeout: 30000 });
    await aiAssistantLink.click();

    // Wait for navigation to complete
    await this.page.waitForURL('**/workspace/chatbot**', { timeout: 30000 });
  }

  /**
   * Navigate to Conversations section
   */
  async navigateToConversations() {
    await this.page.waitForLoadState('networkidle');

    const conversationsLink = this.page.getByRole('link', { name: /Conversations/i });
    await conversationsLink.waitFor({ state: 'visible', timeout: 30000 });
    await conversationsLink.click();
  }

  /**
   * Navigate to Projects section
   */
  async navigateToProjects() {
    await this.page.waitForLoadState('networkidle');

    const projectsLink = this.page.getByRole('link', { name: /Projects/i });
    await projectsLink.waitFor({ state: 'visible', timeout: 30000 });
    await projectsLink.click();
  }

  /**
   * Navigate to Settings section
   */
  async navigateToSettings() {
    await this.page.waitForLoadState('networkidle');

    const settingsLink = this.page.getByRole('link', { name: /Settings/i });
    await settingsLink.waitFor({ state: 'visible', timeout: 30000 });
    await settingsLink.click();
  }

  /**
   * Check if we're on the dashboard/workspace page
   */
  async isOnDashboard(): Promise<boolean> {
    return this.page.url().includes('/workspace');
  }
}
