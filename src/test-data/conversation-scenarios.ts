/**
 * 多轮对话测试数据
 * 定义各种对话场景和预期行为
 */

export interface ContextCheck {
  shouldReference: string[];
  mode: 'any' | 'all';
}

export interface QualityCheck {
  minLength?: number;
  minWords?: number;
  forbiddenPhrases?: string[];
}

export interface ConversationTurn {
  userMessage: string;
  expectedKeywords?: string[];
  contextCheck?: ContextCheck;
  qualityCheck?: QualityCheck;
}

export interface ConversationScenario {
  name: string;
  description: string;
  turns: ConversationTurn[];
}

// 上下文连续性测试场景 - Based on actual NooshAI Chatbot capabilities
// Supported: Create Project, Copy Project, Create Order, Search Project, Create Draft Order, Reorder
export const CONTEXT_CONTINUITY_SCENARIOS: ConversationScenario[] = [
  {
    name: '项目搜索与复制流程',
    description: '测试搜索项目后复制的完整流程',
    turns: [
      {
        userMessage: 'Search for projects with keyword test',
        expectedKeywords: ['project', 'search', 'found'],
        qualityCheck: { minLength: 50 },
      },
      {
        userMessage: 'Copy the first project and rename it to Test Copy Project',
        expectedKeywords: ['copy', 'project'],
        contextCheck: {
          shouldReference: ['project'],
          mode: 'any',
        },
      },
    ],
  },
  {
    name: '项目创建流程',
    description: '测试创建项目的完整流程',
    turns: [
      {
        userMessage: 'Create a project with name Marketing Campaign 2024, with due date being two weeks from now',
        expectedKeywords: ['project', 'marketing', 'campaign'],
      },
      {
        userMessage: 'What is the status of this project?',
        expectedKeywords: ['project', 'status'],
        contextCheck: {
          shouldReference: ['project', 'marketing'],
          mode: 'any',
        },
      },
    ],
  },
];

// 逻辑一致性测试场景 - Based on actual NooshAI Chatbot capabilities
export const LOGIC_CONSISTENCY_SCENARIOS: ConversationScenario[] = [
  {
    name: '项目创建与搜索一致性',
    description: '测试创建项目后能否搜索到',
    turns: [
      {
        userMessage: 'Create a project with name Test Alpha Project',
        expectedKeywords: ['project', 'alpha'],
      },
      {
        userMessage: 'Search for projects with keyword Alpha',
        expectedKeywords: ['project', 'alpha'],
        contextCheck: {
          shouldReference: ['alpha'],
          mode: 'any',
        },
      },
    ],
  },
  {
    name: '订单创建流程',
    description: '测试创建订单的一致性',
    turns: [
      {
        userMessage: 'Create a draft order for project testing',
        expectedKeywords: ['order', 'draft'],
      },
      {
        userMessage: 'What is the status of this order?',
        expectedKeywords: ['order', 'status'],
        contextCheck: {
          shouldReference: ['order'],
          mode: 'any',
        },
      },
    ],
  },
];

// 上下文切换测试场景 - Based on actual NooshAI Chatbot capabilities
export const CONTEXT_SWITCHING_SCENARIOS: ConversationScenario[] = [
  {
    name: '项目与订单切换',
    description: '测试在项目和订单话题间切换',
    turns: [
      {
        userMessage: 'Search for projects with keyword marketing',
        expectedKeywords: ['project', 'search'],
      },
      {
        userMessage: 'Actually, I want to create a draft order instead',
        expectedKeywords: ['order', 'draft'],
        contextCheck: {
          shouldReference: [],
          mode: 'any',
        },
      },
    ],
  },
  {
    name: '多项目操作',
    description: '测试在多个项目间切换',
    turns: [
      {
        userMessage: 'Create a project with name Website Redesign 2024',
        expectedKeywords: ['project', 'website', 'redesign'],
      },
      {
        userMessage: 'Now search for projects with keyword marketing',
        expectedKeywords: ['project', 'search', 'marketing'],
      },
      {
        userMessage: 'Go back to the Website Redesign project',
        expectedKeywords: ['website', 'redesign'],
        contextCheck: {
          shouldReference: ['website', 'redesign'],
          mode: 'any',
        },
      },
    ],
  },
];

// 错误恢复测试场景 - Based on actual NooshAI Chatbot capabilities
export const ERROR_RECOVERY_SCENARIOS: ConversationScenario[] = [
  {
    name: '无效输入后恢复',
    description: '测试AI在收到无效输入后能否继续正常对话',
    turns: [
      {
        userMessage: 'Search for projects',
        expectedKeywords: ['project'],
      },
      {
        userMessage: 'xyzabc123invalid456',
        expectedKeywords: [], // 无效输入
        qualityCheck: {
          forbiddenPhrases: [], // 不应该崩溃
        },
      },
      {
        userMessage: 'Create a project with name Recovery Test Project',
        expectedKeywords: ['project', 'recovery'],
        contextCheck: {
          shouldReference: ['project'],
          mode: 'any',
        },
      },
    ],
  },
  {
    name: '项目名称补充',
    description: '测试AI在信息不明确时的处理',
    turns: [
      {
        userMessage: 'Create a project',
        expectedKeywords: ['project', 'name'], // 应该询问项目名
      },
      {
        userMessage: 'The name should be Mobile App Development with due date next month',
        expectedKeywords: ['mobile', 'app'],
        contextCheck: {
          shouldReference: ['project'],
          mode: 'any',
        },
      },
    ],
  },
];

// 复杂对话流程测试场景 - Based on actual NooshAI Chatbot capabilities
// Supported: Create Project, Copy Project, Create Order, Search Project, Create Draft Order, Reorder
export const COMPLEX_CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    name: '完整项目管理流程',
    description: '模拟真实的项目创建和复制流程',
    turns: [
      {
        userMessage: 'Create a project with name Marketing Campaign 2024, with due date being one month from now',
        expectedKeywords: ['project', 'marketing', 'campaign'],
      },
      {
        userMessage: 'Copy this project and rename it to Marketing Campaign Q2',
        expectedKeywords: ['copy', 'project', 'marketing'],
        contextCheck: {
          shouldReference: ['project', 'marketing'],
          mode: 'any',
        },
      },
      {
        userMessage: 'Search for all marketing projects',
        expectedKeywords: ['project', 'marketing', 'search'],
        contextCheck: {
          shouldReference: ['marketing'],
          mode: 'any',
        },
      },
    ],
  },
  {
    name: '订单管理流程',
    description: '模拟真实的订单创建流程',
    turns: [
      {
        userMessage: 'Create a draft order',
        expectedKeywords: ['order', 'draft'],
      },
      {
        userMessage: 'What orders do I have?',
        expectedKeywords: ['order'],
        contextCheck: {
          shouldReference: ['order'],
          mode: 'any',
        },
      },
    ],
  },
];

// 所有场景的集合
export const ALL_CONVERSATION_SCENARIOS = {
  contextContinuity: CONTEXT_CONTINUITY_SCENARIOS,
  logicConsistency: LOGIC_CONSISTENCY_SCENARIOS,
  contextSwitching: CONTEXT_SWITCHING_SCENARIOS,
  errorRecovery: ERROR_RECOVERY_SCENARIOS,
  complex: COMPLEX_CONVERSATION_SCENARIOS,
};

/**
 * 验证响应是否包含预期关键词
 */
export function validateKeywords(
  response: string,
  expectedKeywords: string[],
  mode: 'any' | 'all' = 'any'
): { passed: boolean; found: string[]; missing: string[] } {
  const responseLower = response.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const keyword of expectedKeywords) {
    if (responseLower.includes(keyword.toLowerCase())) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const passed = mode === 'any'
    ? found.length > 0 || expectedKeywords.length === 0
    : missing.length === 0;

  return { passed, found, missing };
}

/**
 * 验证上下文引用
 */
export function validateContextReference(
  response: string,
  contextCheck: ContextCheck
): { passed: boolean; found: string[]; missing: string[] } {
  return validateKeywords(response, contextCheck.shouldReference, contextCheck.mode);
}

/**
 * 验证响应质量
 */
export function validateQuality(
  response: string,
  qualityCheck: QualityCheck
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (qualityCheck.minLength && response.length < qualityCheck.minLength) {
    errors.push(`Response too short: ${response.length} < ${qualityCheck.minLength}`);
  }

  if (qualityCheck.minWords) {
    const wordCount = response.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < qualityCheck.minWords) {
      errors.push(`Not enough words: ${wordCount} < ${qualityCheck.minWords}`);
    }
  }

  if (qualityCheck.forbiddenPhrases) {
    const responseLower = response.toLowerCase();
    for (const phrase of qualityCheck.forbiddenPhrases) {
      if (responseLower.includes(phrase.toLowerCase())) {
        errors.push(`Found forbidden phrase: "${phrase}"`);
      }
    }
  }

  return { passed: errors.length === 0, errors };
}
