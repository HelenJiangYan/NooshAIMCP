import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, ChildProcess } from "child_process";

/**
 * Validation check options for comprehensive chatbot response validation
 */
export interface ValidationChecks {
  notEmpty?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  requiredKeywords?: string[];
  forbiddenKeywords?: string[];
  notError?: boolean;
}

/**
 * Result of a single validation check
 */
export interface CheckResult {
  passed: boolean;
  details?: string;
}

/**
 * Result from comprehensive validation
 */
export interface ValidationResult {
  isValid: boolean;
  results: Record<string, CheckResult>;
  responsePreview: string;
}

/**
 * Result from pattern validation
 */
export interface PatternValidationResult {
  isValid: boolean;
  matched: boolean;
  pattern: string;
  responseLength: number;
}

/**
 * Result from keyword validation
 */
export interface KeywordValidationResult {
  isValid: boolean;
  missingKeywords: string[];
  foundForbidden: string[];
  responseLength: number;
}

/**
 * ChatbotValidatorClient - MCP Client for Chatbot Response Validation
 *
 * Connects to the chatbot-validator MCP server and provides methods
 * to validate AI chatbot responses in Playwright tests.
 */
export class ChatbotValidatorClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;
  private isConnected = false;

  /**
   * Initialize and connect to the MCP server
   * @param serverPath Path to the compiled MCP server JS file
   */
  async connect(serverPath: string = "dist/src/mcp/chatbot-validator-server.js"): Promise<void> {
    if (this.isConnected) {
      return;
    }

    this.transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
    });

    this.client = new Client(
      {
        name: "playwright-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
    this.isConnected = true;
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    this.isConnected = false;
  }

  /**
   * Ensure client is connected
   */
  private ensureConnected(): void {
    if (!this.client || !this.isConnected) {
      throw new Error("MCP Client not connected. Call connect() first.");
    }
  }

  /**
   * Validate chatbot response against a regex pattern
   */
  async validatePattern(
    response: string,
    pattern: string,
    shouldMatch = true
  ): Promise<PatternValidationResult> {
    this.ensureConnected();

    const result = await this.client!.callTool({
      name: "validate_response_pattern",
      arguments: {
        response,
        pattern,
        shouldMatch,
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    return JSON.parse(content[0].text) as PatternValidationResult;
  }

  /**
   * Validate chatbot response contains required keywords
   */
  async validateKeywords(
    response: string,
    requiredKeywords: string[],
    forbiddenKeywords?: string[],
    caseSensitive = false
  ): Promise<KeywordValidationResult> {
    this.ensureConnected();

    const result = await this.client!.callTool({
      name: "validate_response_keywords",
      arguments: {
        response,
        requiredKeywords,
        forbiddenKeywords,
        caseSensitive,
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    return JSON.parse(content[0].text) as KeywordValidationResult;
  }

  /**
   * Validate chatbot response length
   */
  async validateLength(
    response: string,
    minLength?: number,
    maxLength?: number
  ): Promise<{ isValid: boolean; actualLength: number; errors: string[] }> {
    this.ensureConnected();

    const result = await this.client!.callTool({
      name: "validate_response_length",
      arguments: {
        response,
        minLength,
        maxLength,
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    return JSON.parse(content[0].text);
  }

  /**
   * Validate chatbot response is not an error message
   */
  async validateNotError(
    response: string,
    customErrorPatterns?: string[]
  ): Promise<{ isValid: boolean; isError: boolean; matchedErrorPatterns: string[] }> {
    this.ensureConnected();

    const result = await this.client!.callTool({
      name: "validate_response_not_error",
      arguments: {
        response,
        errorPatterns: customErrorPatterns,
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    return JSON.parse(content[0].text);
  }

  /**
   * Comprehensive validation with multiple checks
   */
  async validate(response: string, checks: ValidationChecks): Promise<ValidationResult> {
    this.ensureConnected();

    const result = await this.client!.callTool({
      name: "validate_chatbot_response",
      arguments: {
        response,
        checks,
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    return JSON.parse(content[0].text) as ValidationResult;
  }

  /**
   * List available validation tools
   */
  async listTools(): Promise<string[]> {
    this.ensureConnected();

    const result = await this.client!.listTools();
    return result.tools.map((tool) => tool.name);
  }
}

// Singleton instance for easy use in tests
let validatorInstance: ChatbotValidatorClient | null = null;

/**
 * Get or create the singleton validator client
 */
export async function getValidator(
  serverPath?: string
): Promise<ChatbotValidatorClient> {
  if (!validatorInstance) {
    validatorInstance = new ChatbotValidatorClient();
    await validatorInstance.connect(serverPath);
  }
  return validatorInstance;
}

/**
 * Close the singleton validator client
 */
export async function closeValidator(): Promise<void> {
  if (validatorInstance) {
    await validatorInstance.disconnect();
    validatorInstance = null;
  }
}
