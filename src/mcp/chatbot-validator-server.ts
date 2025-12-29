import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * MCP Server for Chatbot Response Validation
 *
 * Provides tools to validate AI chatbot responses against expected patterns,
 * keywords, sentiment, and other criteria.
 */

const server = new McpServer({
  name: "chatbot-validator",
  version: "1.0.0",
});

/**
 * Tool: validate_response_pattern
 * Validates chatbot response against a regex pattern
 */
server.tool(
  "validate_response_pattern",
  "Validates AI chatbot response against a regex pattern",
  {
    response: z.string().describe("The chatbot response text to validate"),
    pattern: z.string().describe("Regex pattern to match against"),
    shouldMatch: z.boolean().default(true).describe("Whether the pattern should match (true) or not match (false)"),
  },
  async (input) => {
    try {
      const regex = new RegExp(input.pattern, "i");
      const matches = regex.test(input.response);
      const isValid = matches === input.shouldMatch;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              isValid,
              matched: matches,
              pattern: input.pattern,
              responseLength: input.response.length,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              isValid: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Tool: validate_response_keywords
 * Validates chatbot response contains expected keywords
 */
server.tool(
  "validate_response_keywords",
  "Validates AI chatbot response contains expected keywords",
  {
    response: z.string().describe("The chatbot response text to validate"),
    requiredKeywords: z.array(z.string()).describe("Keywords that must be present"),
    forbiddenKeywords: z.array(z.string()).optional().describe("Keywords that must NOT be present"),
    caseSensitive: z.boolean().default(false).describe("Whether keyword matching is case-sensitive"),
  },
  async (input) => {
    const responseText = input.caseSensitive ? input.response : input.response.toLowerCase();
    const missingKeywords: string[] = [];
    const foundForbidden: string[] = [];

    // Check required keywords
    for (const keyword of input.requiredKeywords) {
      const searchKeyword = input.caseSensitive ? keyword : keyword.toLowerCase();
      if (!responseText.includes(searchKeyword)) {
        missingKeywords.push(keyword);
      }
    }

    // Check forbidden keywords
    if (input.forbiddenKeywords) {
      for (const keyword of input.forbiddenKeywords) {
        const searchKeyword = input.caseSensitive ? keyword : keyword.toLowerCase();
        if (responseText.includes(searchKeyword)) {
          foundForbidden.push(keyword);
        }
      }
    }

    const isValid = missingKeywords.length === 0 && foundForbidden.length === 0;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            isValid,
            missingKeywords,
            foundForbidden,
            responseLength: input.response.length,
          }),
        },
      ],
    };
  }
);

/**
 * Tool: validate_response_length
 * Validates chatbot response length is within expected bounds
 */
server.tool(
  "validate_response_length",
  "Validates AI chatbot response length is within bounds",
  {
    response: z.string().describe("The chatbot response text to validate"),
    minLength: z.number().optional().describe("Minimum expected length"),
    maxLength: z.number().optional().describe("Maximum expected length"),
  },
  async (input) => {
    const length = input.response.length;
    const errors: string[] = [];

    if (input.minLength !== undefined && length < input.minLength) {
      errors.push(`Response too short: ${length} < ${input.minLength}`);
    }

    if (input.maxLength !== undefined && length > input.maxLength) {
      errors.push(`Response too long: ${length} > ${input.maxLength}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            isValid: errors.length === 0,
            actualLength: length,
            errors,
          }),
        },
      ],
    };
  }
);

/**
 * Tool: validate_response_not_error
 * Validates chatbot response doesn't contain error messages
 */
server.tool(
  "validate_response_not_error",
  "Validates AI chatbot response is not an error message",
  {
    response: z.string().describe("The chatbot response text to validate"),
    errorPatterns: z.array(z.string()).optional().describe("Custom error patterns to check"),
  },
  async (input) => {
    const defaultErrorPatterns = [
      "error",
      "sorry.*couldn't",
      "unable to",
      "failed to",
      "something went wrong",
      "try again",
      "not available",
      "服务.*异常",
      "出错",
      "失败",
    ];

    const patterns = input.errorPatterns || defaultErrorPatterns;
    const responseText = input.response.toLowerCase();
    const foundErrors: string[] = [];

    for (const pattern of patterns) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(responseText)) {
        foundErrors.push(pattern);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            isValid: foundErrors.length === 0,
            isError: foundErrors.length > 0,
            matchedErrorPatterns: foundErrors,
          }),
        },
      ],
    };
  }
);

/**
 * Tool: validate_chatbot_response
 * Comprehensive validation combining multiple checks
 */
server.tool(
  "validate_chatbot_response",
  "Comprehensive validation of AI chatbot response with multiple criteria",
  {
    response: z.string().describe("The chatbot response text to validate"),
    checks: z.object({
      notEmpty: z.boolean().optional().describe("Response should not be empty"),
      minLength: z.number().optional().describe("Minimum length"),
      maxLength: z.number().optional().describe("Maximum length"),
      pattern: z.string().optional().describe("Regex pattern to match"),
      requiredKeywords: z.array(z.string()).optional().describe("Required keywords"),
      forbiddenKeywords: z.array(z.string()).optional().describe("Forbidden keywords"),
      notError: z.boolean().optional().describe("Should not be an error message"),
    }).describe("Validation checks to perform"),
  },
  async (input) => {
    const results: Record<string, { passed: boolean; details?: string }> = {};
    const { response, checks } = input;

    // Check not empty
    if (checks.notEmpty) {
      const passed = response.trim().length > 0;
      results.notEmpty = { passed, details: passed ? undefined : "Response is empty" };
    }

    // Check min length
    if (checks.minLength !== undefined) {
      const passed = response.length >= checks.minLength;
      results.minLength = {
        passed,
        details: passed ? undefined : `Length ${response.length} < ${checks.minLength}`,
      };
    }

    // Check max length
    if (checks.maxLength !== undefined) {
      const passed = response.length <= checks.maxLength;
      results.maxLength = {
        passed,
        details: passed ? undefined : `Length ${response.length} > ${checks.maxLength}`,
      };
    }

    // Check pattern
    if (checks.pattern) {
      try {
        const regex = new RegExp(checks.pattern, "i");
        const passed = regex.test(response);
        results.pattern = {
          passed,
          details: passed ? undefined : `Pattern "${checks.pattern}" not matched`,
        };
      } catch (e) {
        results.pattern = { passed: false, details: `Invalid pattern: ${checks.pattern}` };
      }
    }

    // Check required keywords
    if (checks.requiredKeywords && checks.requiredKeywords.length > 0) {
      const responseLC = response.toLowerCase();
      const missing = checks.requiredKeywords.filter(
        (kw: string) => !responseLC.includes(kw.toLowerCase())
      );
      results.requiredKeywords = {
        passed: missing.length === 0,
        details: missing.length > 0 ? `Missing: ${missing.join(", ")}` : undefined,
      };
    }

    // Check forbidden keywords
    if (checks.forbiddenKeywords && checks.forbiddenKeywords.length > 0) {
      const responseLC = response.toLowerCase();
      const found = checks.forbiddenKeywords.filter((kw: string) =>
        responseLC.includes(kw.toLowerCase())
      );
      results.forbiddenKeywords = {
        passed: found.length === 0,
        details: found.length > 0 ? `Found forbidden: ${found.join(", ")}` : undefined,
      };
    }

    // Check not error
    if (checks.notError) {
      const errorPatterns = ["error", "sorry.*couldn't", "failed", "unable to"];
      const responseLC = response.toLowerCase();
      const isError = errorPatterns.some((p) => new RegExp(p, "i").test(responseLC));
      results.notError = {
        passed: !isError,
        details: isError ? "Response appears to be an error message" : undefined,
      };
    }

    const allPassed = Object.values(results).every((r) => r.passed);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            isValid: allPassed,
            results,
            responsePreview: response.substring(0, 100) + (response.length > 100 ? "..." : ""),
          }),
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Use stderr for logging (stdout is reserved for JSON-RPC)
  console.error("Chatbot Validator MCP Server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
