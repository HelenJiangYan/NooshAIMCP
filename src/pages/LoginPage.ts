import { Page } from '@playwright/test';

// Auth URL for login (different from base URL)
const AUTH_URL = process.env.AUTH_URL || 'https://nooshauth.qa2.noosh.com/login';
const BASE_URL = process.env.BASE_URL || 'https://nooshchat.qa2.noosh.com';

/**
 * LoginPage - Page Object Model for NooshAI Login Page
 *
 * Handles authentication flow using user-facing locators
 */
export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to login page (using AUTH_URL)
   */
  async goto() {
    await this.page.goto(AUTH_URL);
  }

  /**
   * Handle cookie consent popup if present
   */
  async handleCookieConsent() {
    const acceptButton = this.page.getByRole('button', { name: 'Accept All' });
    if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptButton.click();
    }
  }

  /**
   * Perform login with username and password
   * Uses user-facing locators (getByRole)
   */
  async login(username: string, password: string) {
    // Handle cookie consent first
    await this.handleCookieConsent();

    // Use getByRole for form inputs (actual element names from page)
    await this.page.getByRole('textbox', { name: 'User ID' }).fill(username);
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);

    // Use getByRole for button
    await this.page.getByRole('button', { name: 'Login' }).click();

    // Wait for login to complete, then navigate to BASE_URL
    await this.page.waitForLoadState('networkidle');
    await this.page.goto(BASE_URL);
    await this.page.waitForURL('**/nooshchat.qa2.noosh.com/**', { timeout: 30000 });
  }

  /**
   * Complete login flow from environment variables
   */
  async loginWithEnvCredentials() {
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;

    if (!username || !password) {
      throw new Error('TEST_USERNAME and TEST_PASSWORD must be set in environment');
    }

    await this.goto();
    await this.login(username, password);
  }
}
