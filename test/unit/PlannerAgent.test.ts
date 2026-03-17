/**
 * Planner Agent 单元测试
 */

import { PlannerAgent } from '../../src/agents/PlannerAgent';
import { LLMClient } from '../../src/agents/LLMClient';
import { PlanningResponse, SubtaskPlan, ValidationResult } from '../../src/types/planning';
import { Subtask, TaskStatus } from '../../src/types/task';

// 模拟 LLMClient
jest.mock('../../src/agents/LLMClient');

// 测试用的模拟 LLM 响应
const MOCK_PLANNING_RESPONSE: PlanningResponse = {
  subtasks: [
    {
      id: 'step_1',
      description: '搜索相关信息',
      agent: 'search',
      input: '用户请求: 分析苹果公司的投资价值',
      depends_on: [],
      expected_output: '搜索结果列表',
    },
    {
      id: 'step_2',
      description: '分析财务数据',
      agent: 'malong',
      input: '搜索结果',
      depends_on: ['step_1'],
      expected_output: '财务分析报告',
    },
    {
      id: 'step_3',
      description: '生成投资建议',
      agent: 'malong',
      input: '财务分析报告',
      depends_on: ['step_2'],
      expected_output: '投资建议文档',
    },
  ],
  execution_order: 'serial',
  summary: '分析苹果公司投资价值并给出建议',
};

const MOCK_PARALLEL_RESPONSE: PlanningResponse = {
  subtasks: [
    {
      id: 'step_1',
      description: '搜索天气',
      agent: 'search',
      input: '北京天气',
      depends_on: [],
      expected_output: '天气信息',
    },
    {
      id: 'step_2',
      description: '搜索新闻',
      agent: 'search',
      input: '今日新闻',
      depends_on: [],
      expected_output: '新闻列表',
    },
  ],
  execution_order: 'parallel',
  summary: '并行搜索天气和新闻',
};

describe('PlannerAgent', () => {
  let plannerAgent: PlannerAgent;
  let mockLLMClient: jest.Mocked<LLMClient>;

  beforeEach(() => {
    // 重置 mock
    mockLLMClient = {
      chat: jest.fn(),
      updateConfig: jest.fn(),
      getConfig: jest.fn(),
    } as any;

    // 创建 PlannerAgent 实例并注入 mock
    plannerAgent = Object.create(PlannerAgent.prototype);
    (plannerAgent as any).llmClient = mockLLMClient;
    (plannerAgent as any).maxRetries = 3;
  });

  describe('decompose', () => {
    it('应该成功调用 LLM 并返回规划结果', async () => {
      mockLLMClient.chat.mockResolvedValue({
        content: JSON.stringify(MOCK_PLANNING_RESPONSE),
      });

      const result = await plannerAgent.decompose('分析苹果公司的投资价值');

      expect(mockLLMClient.chat).toHaveBeenCalled();
      expect(result.subtasks).toHaveLength(3);
      expect(result.execution_order).toBe('serial');
    });

    it('应该抛出错误当请求为空', async () => {
      await expect(plannerAgent.decompose('')).rejects.toThrow('用户请求不能为空');
      await expect(plannerAgent.decompose('   ')).rejects.toThrow('用户请求不能为空');
    });

    it('应该正确处理 LLM 错误', async () => {
      mockLLMClient.chat.mockRejectedValue(new Error('API Error'));

      // LLMClientError wraps non-LLMClientError
      await expect(plannerAgent.decompose('测试请求')).rejects.toThrow();
    });
  });

  describe('parseResponse', () => {
    it('应该正确解析 JSON 响应', () => {
      const result = plannerAgent.parseResponse(JSON.stringify(MOCK_PLANNING_RESPONSE));

      expect(result.subtasks).toHaveLength(3);
      expect(result.subtasks[0].agent).toBe('search');
      expect(result.execution_order).toBe('serial');
    });

    it('应该正确解析包含 JSON 代码块的响应', () => {
      const responseWithCodeBlock = `\`\`\`json
${JSON.stringify(MOCK_PLANNING_RESPONSE)}
\`\`\``;

      const result = plannerAgent.parseResponse(responseWithCodeBlock);

      expect(result.subtasks).toHaveLength(3);
    });

    it('应该正确解析包含任意代码块的响应', () => {
      const responseWithCodeBlock = `\`\`\`
${JSON.stringify(MOCK_PLANNING_RESPONSE)}
\`\`\``;

      const result = plannerAgent.parseResponse(responseWithCodeBlock);

      expect(result.subtasks).toHaveLength(3);
    });

    it('应该正确解析包含 JSON 的响应', () => {
      const responseWithText = `以下是任务规划：${JSON.stringify(MOCK_PLANNING_RESPONSE)} 请确认。`;

      const result = plannerAgent.parseResponse(responseWithText);

      expect(result.subtasks).toHaveLength(3);
    });

    it('应该抛出错误当响应无效 JSON', () => {
      expect(() => plannerAgent.parseResponse('not valid json')).toThrow('无法从响应中提取 JSON');
    });

    it('应该抛出错误当响应缺少 subtasks', () => {
      const invalidResponse = { execution_order: 'serial', summary: 'test' };

      expect(() =>
        plannerAgent.parseResponse(JSON.stringify(invalidResponse))
      ).toThrow('响应缺少 subtasks 字段');
    });

    it('应该设置默认值当缺少可选字段', () => {
      const partialResponse = {
        subtasks: [{ id: '1', description: 'test', agent: 'search', input: 'a', depends_on: [], expected_output: 'b' }],
      };

      const result = plannerAgent.parseResponse(JSON.stringify(partialResponse));

      expect(result.execution_order).toBe('serial');
      expect(result.summary).toBe('');
    });
  });

  describe('convertToSubtasks', () => {
    it('应该正确转换为 Subtask 列表', () => {
      const taskId = 'task_123';
      const result = plannerAgent.convertToSubtasks(MOCK_PLANNING_RESPONSE, taskId);

      expect(result).toHaveLength(3);
      expect(result[0].taskId).toBe(taskId);
      expect(result[0].id).toBe('task_123_subtask_1');
      expect(result[0].status).toBe(TaskStatus.PENDING);
      expect(result[0].agent).toBe('search');
      // 依赖 ID 现在应该被映射到新的 subtask ID
      expect(result[1].dependsOn).toContain('task_123_subtask_1');
    });

    it('应该正确处理并行任务', () => {
      const result = plannerAgent.convertToSubtasks(MOCK_PARALLEL_RESPONSE, 'task_parallel');

      expect(result).toHaveLength(2);
      expect(result[0].dependsOn).toHaveLength(0);
      expect(result[1].dependsOn).toHaveLength(0);
    });
  });

  describe('validateSubtasks', () => {
    it('应该通过有效的子任务列表', () => {
      const subtasks: Subtask[] = [
        {
          id: 'task_1_subtask_1',
          taskId: 'task_1',
          description: '搜索信息',
          agent: 'search',
          status: TaskStatus.PENDING,
          input: '搜索关键词',
          dependsOn: [],
          expected_output: '搜索结果',
        },
        {
          id: 'task_1_subtask_2',
          taskId: 'task_1',
          description: '分析数据',
          agent: 'malong',
          status: TaskStatus.PENDING,
          input: '搜索结果',
          dependsOn: ['task_1_subtask_1'],
          expected_output: '分析报告',
        },
      ];

      const result = plannerAgent.validateSubtasks(subtasks);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测空子任务列表', () => {
      const result = plannerAgent.validateSubtasks([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('子任务列表不能为空');
    });

    it('应该检测无效的 agent 类型', () => {
      const subtasks: Subtask[] = [
        {
          id: 'task_1_subtask_1',
          taskId: 'task_1',
          description: '测试任务',
          agent: 'invalid_agent' as any,
          status: TaskStatus.PENDING,
          input: '输入',
          dependsOn: [],
          expected_output: '输出',
        },
      ];

      const result = plannerAgent.validateSubtasks(subtasks);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('agent 类型无效'))).toBe(true);
    });

    it('应该检测不存在的依赖', () => {
      const subtasks: Subtask[] = [
        {
          id: 'task_1_subtask_1',
          taskId: 'task_1',
          description: '任务1',
          agent: 'search',
          status: TaskStatus.PENDING,
          input: '输入',
          dependsOn: ['non_existent'],
          expected_output: '输出',
        },
      ];

      const result = plannerAgent.validateSubtasks(subtasks);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('依赖'))).toBe(true);
    });

    it('应该检测循环依赖', () => {
      const subtasks: Subtask[] = [
        {
          id: 'task_1_subtask_1',
          taskId: 'task_1',
          description: '任务1',
          agent: 'search',
          status: TaskStatus.PENDING,
          input: '输入',
          dependsOn: ['task_1_subtask_2'],
          expected_output: '输出',
        },
        {
          id: 'task_1_subtask_2',
          taskId: 'task_1',
          description: '任务2',
          agent: 'malong',
          status: TaskStatus.PENDING,
          input: '输入',
          dependsOn: ['task_1_subtask_1'],
          expected_output: '输出',
        },
      ];

      const result = plannerAgent.validateSubtasks(subtasks);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('循环依赖'))).toBe(true);
    });

    it('应该对空输入发出警告', () => {
      const subtasks: Subtask[] = [
        {
          id: 'task_1_subtask_1',
          taskId: 'task_1',
          description: '任务',
          agent: 'search',
          status: TaskStatus.PENDING,
          input: '',
          dependsOn: [],
          expected_output: '输出',
        },
      ];

      const result = plannerAgent.validateSubtasks(subtasks);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('输入为空'))).toBe(true);
    });

    it('应该对缺少描述发出错误', () => {
      const subtasks: Subtask[] = [
        {
          id: 'task_1_subtask_1',
          taskId: 'task_1',
          description: '',
          agent: 'search',
          status: TaskStatus.PENDING,
          input: '输入',
          dependsOn: [],
          expected_output: '输出',
        },
      ];

      const result = plannerAgent.validateSubtasks(subtasks);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('描述'))).toBe(true);
    });

    it('应该对缺少 agent 发出错误', () => {
      const subtasks: Subtask[] = [
        {
          id: 'task_1_subtask_1',
          taskId: 'task_1',
          description: '任务',
          agent: undefined as any,
          status: TaskStatus.PENDING,
          input: '输入',
          dependsOn: [],
          expected_output: '输出',
        },
      ];

      const result = plannerAgent.validateSubtasks(subtasks);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('agent'))).toBe(true);
    });
  });

  describe('plan (完整流程)', () => {
    it('应该完成完整的任务规划流程', async () => {
      mockLLMClient.chat.mockResolvedValue({
        content: JSON.stringify(MOCK_PLANNING_RESPONSE),
      });

      const result = await plannerAgent.plan('分析苹果公司投资价值', 'task_123');

      expect(result.subtasks).toHaveLength(3);
      expect(result.validation.valid).toBe(true);
      expect(mockLLMClient.chat).toHaveBeenCalled();
    });

    it('应该在验证失败时返回错误', async () => {
      // 创建没有依赖但被标记为串行的响应
      const invalidResponse: PlanningResponse = {
        subtasks: [
          {
            id: 'step_1',
            description: '',
            agent: 'search',
            input: 'input',
            depends_on: [],
            expected_output: 'output',
          },
        ],
        execution_order: 'serial',
        summary: 'test',
      };

      mockLLMClient.chat.mockResolvedValue({
        content: JSON.stringify(invalidResponse),
      });

      const result = await plannerAgent.plan('测试', 'task_123');

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });
  });
});
