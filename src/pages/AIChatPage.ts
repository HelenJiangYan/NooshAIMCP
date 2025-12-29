import { Page, expect, Locator } from '@playwright/test';

/**
 * AIChatPage - Page Object Model for NooshAI Assistant Chat Page
 *
 * Handles AI chatbot interactions using user-facing locators.
 * Note: Use DashboardPage.navigateToAIAssistant() to navigate here first.
 */
export class AIChatPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the chat page to be ready
   */
  async waitForReady() {
    await this.getChatInput().waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Get the chat input element
   * The input may have different names:
   * - "Message or enter / to select a skill" (welcome screen)
   * - "Enter your message..." (during/after chat)
   * - "Sending..." (while sending, disabled)
   */
  getChatInput(): Locator {
    // Try multiple selectors to find the chat input
    return this.page.getByRole('textbox', { name: /Message or enter|Enter your message/i });
  }

  /**
   * Get the send button (button next to input, enabled when input has text)
   * The button is in the input area, becomes enabled when there's text
   */
  getSendButton(): Locator {
    // The send button is in the flex container with the input
    // It's a button that contains an SVG or img for the send icon
    return this.page.locator('button.flex.items-center.justify-center.h-8.w-8').first();
  }

  /**
   * Send a message to the AI chatbot
   * Fills input and clicks the blue Submit button (with airplane icon)
   */
  async sendMessage(message: string) {
    // Wait for input to be ready
    const chatInput = this.getChatInput();
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });

    // Click on input to focus it
    await chatInput.click();
    await this.page.waitForTimeout(300);

    // Fill in the message
    await chatInput.fill(message);

    // Wait for the UI to update (send button to enable)
    await this.page.waitForTimeout(500);

    // The send button is the sibling button right after the textbox
    // Structure: div > textbox + button (with img inside)
    // Find the parent div that contains the textbox, then find the button sibling
    const sendButton = chatInput.locator('xpath=following-sibling::button').first();

    try {
      await sendButton.waitFor({ state: 'visible', timeout: 3000 });
      await sendButton.click();
    } catch {
      // Fallback: try pressing Enter
      await chatInput.press('Enter');
    }

    // Wait for the message to be sent
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for AI response to appear
   * Timeout is longer due to AI processing time
   */
  async waitForResponse(timeoutMs = 60000) {
    // Wait for the "Copy message" button to appear - this indicates AI has finished responding
    try {
      const copyButton = this.page.getByRole('button', { name: 'Copy message' });
      await copyButton.first().waitFor({ state: 'visible', timeout: timeoutMs });

      // Additional wait to ensure response content is fully rendered
      await this.page.waitForTimeout(1000);
    } catch {
      // If Copy message button doesn't appear, wait a bit and continue
      await this.page.waitForTimeout(3000);
    }
  }

  /**
   * Get all chat messages/responses
   */
  getMessages(): Locator {
    // Messages are typically in article elements or message containers
    return this.page.locator('[class*="message"]')
      .or(this.page.getByRole('article'))
      .or(this.page.locator('main').locator('p'));
  }

  /**
   * Get the last response from the AI
   *
   * Uses user-facing locators (Playwright best practice):
   * - getByRole('button', { name: 'Copy message' }) to find the AI response container
   * - The response text is in a sibling element of the Copy message button
   *
   * DOM structure (from accessibility snapshot):
   *   generic [ref=e449]:
   *     button "Copy message" [ref=e452]
   *     generic [ref=e457]:           <- content container (sibling)
   *       paragraph: Hello! 👋
   *       paragraph: How can I assist...
   *     generic: 16:11               <- timestamp
   */
  async getLastResponse(): Promise<string> {
    try {
      // Strategy 1: Use Playwright's getByRole to find "Copy message" button
      // Then get sibling paragraph using page.evaluate for reliable DOM traversal
      const copyMessageButtons = this.page.getByRole('button', { name: 'Copy message' });
      const buttonCount = await copyMessageButtons.count();

      console.log(`Found ${buttonCount} "Copy message" buttons`);

      if (buttonCount > 0) {
        // Get the LAST "Copy message" button (most recent AI response)
        const lastCopyButton = copyMessageButtons.last();

        // Use evaluate on this specific element to get sibling content
        const response = await lastCopyButton.evaluate((button) => {
          const parent = button.parentElement;
          if (!parent) return '';

          const texts: string[] = [];
          const children = Array.from(parent.children);

          for (const child of children) {
            // Skip the copy button itself
            if (child === button) continue;

            // Skip timestamp elements (usually just "HH:MM" format)
            const childText = child.textContent?.trim() || '';
            if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(childText)) continue;

            // If child is a paragraph, get its text directly
            if (child.tagName === 'P') {
              if (childText.length > 3) {
                texts.push(childText);
              }
              continue;
            }

            // Get paragraphs from this sibling
            const paragraphs = child.querySelectorAll('p');
            if (paragraphs.length > 0) {
              for (const p of paragraphs) {
                const pText = p.textContent?.trim();
                if (pText && pText.length > 3) {
                  texts.push(pText);
                }
              }
            }

            // Get list items
            const listItems = child.querySelectorAll('li');
            for (const li of listItems) {
              const liText = li.textContent?.trim();
              if (liText && liText.length > 0) {
                texts.push('- ' + liText);
              }
            }

            // If no paragraphs or lists, get the direct text (skip short)
            if (paragraphs.length === 0 && listItems.length === 0 && childText.length > 10) {
              texts.push(childText);
            }
          }

          return texts.join(' ');
        });

        if (response && response.length > 0) {
          console.log(`Found response via button.evaluate: ${response.substring(0, 100)}...`);
          return response;
        }

        // Fallback: Get parent container text and clean it
        const responseContainer = lastCopyButton.locator('..');
        const containerText = await responseContainer.textContent();

        if (containerText) {
          const cleanedText = containerText
            .replace(/Copy message/gi, '')
            .replace(/\d{1,2}:\d{2}(\s*(AM|PM))?/gi, '')
            .trim();

          if (cleanedText.length > 10) {
            console.log(`Found response via parent container: ${cleanedText.substring(0, 100)}...`);
            return cleanedText;
          }
        }
      }

      // Strategy 2: Find the chat panel (near "Hide sidebar" button) and get paragraphs
      // This is specifically for the active chat, not the sidebar conversations list
      console.log('Strategy 1 failed, trying Strategy 2...');
      const hideSidebarButton = this.page.getByRole('button', { name: 'Hide sidebar' });

      if (await hideSidebarButton.count() > 0) {
        // The chat panel is the sibling of "Hide sidebar" button's parent
        // Structure: generic > [button "Hide sidebar", generic (chat content), generic (input)]
        const chatPanel = hideSidebarButton.locator('..').locator('> *').nth(1);

        if (await chatPanel.count() > 0) {
          // Get paragraphs specifically from the chat panel (not sidebar)
          const paragraphs = chatPanel.locator('p');
          const pCount = await paragraphs.count();

          console.log(`Strategy 2: Found ${pCount} paragraphs in chat panel`);

          const texts: string[] = [];
          for (let i = 0; i < pCount; i++) {
            const text = await paragraphs.nth(i).textContent();
            if (
              text &&
              text.trim().length > 15 &&
              !text.includes('Processing your message') &&
              !/^\d{1,2}:\d{2}$/.test(text.trim())
            ) {
              texts.push(text.trim());
            }
          }

          if (texts.length > 0) {
            // Return the last meaningful paragraph (most likely the AI response)
            const result = texts[texts.length - 1];
            console.log(`Found response via chat panel: ${result.substring(0, 100)}...`);
            return result;
          }
        }
      }

      console.log('No response text found');
      return '';
    } catch (error) {
      console.log('getLastResponse failed:', error);
      return '';
    }
  }

  /**
   * Verify AI response contains expected text
   */
  async expectResponseContains(expectedText: string) {
    const response = await this.getLastResponse();
    expect(response.toLowerCase()).toContain(expectedText.toLowerCase());
  }

  /**
   * Verify AI response is not empty
   */
  async expectResponseNotEmpty() {
    const response = await this.getLastResponse();
    expect(response.length).toBeGreaterThan(0);
  }

  /**
   * Send message and wait for response (convenience method)
   */
  async chat(message: string): Promise<string> {
    await this.sendMessage(message);
    await this.waitForResponse();
    return await this.getLastResponse();
  }
}
