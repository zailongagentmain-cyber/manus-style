/**
 * 集成测试 - Agent 协作测试
 * 测试各 Agent 组件的集成协作
 */

import { AgentScheduler } from '../../src/agents/AgentScheduler';
import { MalongClient } from '../../src/agents/clients/MalongClient';
import { LongyarenClient } from '../../src/agents/clients/LongyarenClient';
import { SearchClient } from '../../src/agents/clients/SearchClient';
import { BrowserClient } from '../../src/agents/clients/BrowserClient';
import { OpenClawClient } from '../../src/agents/OpenClawClient';
import { AgentType, Subtask } from '../../src/types/task';

describe('Agent Integration Tests', () => {
  let scheduler: AgentScheduler;

  beforeAll(() => {
    scheduler = new AgentScheduler();
    scheduler.registerAgent('malong', new MalongClient());
    scheduler.registerAgent('longyaren', new LongyarenClient());
    scheduler.registerAgent('search', new SearchClient());
    scheduler.registerAgent('browser', new BrowserClient());
  });

  describe('Agent 协作', () => {
    it('应该正确选择并使用各个 Agent', () => {
      const malongClient = scheduler.selectAgent('malong');
      const longyarenClient = scheduler.selectAgent('longyaren');
      const searchClient = scheduler.selectAgent('search');
      const browserClient = scheduler.selectAgent('browser');

      expect(malongClient).toBeInstanceOf(MalongClient);
      expect(longyarenClient).toBeInstanceOf(LongyarenClient);
      expect(searchClient).toBeInstanceOf(SearchClient);
      expect(browserClient).toBeInstanceOf(BrowserClient);
    });

    it('应该列出所有注册的 Agent', () => {
      const agents = scheduler.listAgents();
      
      expect(agents).toContain('malong');
      expect(agents).toContain('longyaren');
      expect(agents).toContain('search');
      expect(agents).toContain('browser');
    });
  });

  describe('执行计划构建', () => {
    it('应该为独立任务创建单阶段计划', () => {
      const subtasks: Partial<Subtask>[] = [
        { id: '1', description: '任务1', dependsOn: [] },
        { id: '2', description: '任务2', dependsOn: [] },
      ];

      const plan = scheduler.buildExecutionPlan(subtasks as Subtask[]);

      expect(plan.stages).toHaveLength(1);
      expect(plan.stages[0]).toHaveLength(2);
    });

    it('应该为有依赖的任务创建多阶段计划', () => {
      const subtasks: Partial<Subtask>[] = [
        { id: '1', description: '任务1', dependsOn: [] },
        { id: '2', description: '任务2', dependsOn: ['1'] },
      ];

      const plan = scheduler.buildExecutionPlan(subtasks as Subtask[]);

      expect(plan.stages).toHaveLength(2);
    });

    it('应该正确处理并行分支', () => {
      const subtasks: Partial<Subtask>[] = [
        { id: '1', description: '任务1', dependsOn: [] },
        { id: '2', description: '任务2', dependsOn: ['1'] },
        { id: '3', description: '任务3', dependsOn: ['1'] },
      ];

      const plan = scheduler.buildExecutionPlan(subtasks as Subtask[]);

      expect(plan.stages).toHaveLength(2);
      expect(plan.stages[1]).toHaveLength(2); // 并行执行
    });
  });

  describe('OpenClawClient 集成', () => {
    it('应该能够生成任务 ID', () => {
      const client = new OpenClawClient();
      const id1 = client.generateTaskId();
      const id2 = client.generateTaskId();

      expect(id1).not.toEqual(id2);
    });

    it('应该能够调用各个 Agent', async () => {
      const client = new OpenClawClient();

      const malongResult = await client.spawn({
        agent: 'malong',
        input: '写一个函数',
      });

      expect(malongResult.success).toBe(true);
      expect(malongResult.sessionId).toBeDefined();
    });

    it('应该能够检查健康状态', async () => {
      const client = new OpenClawClient();
      const health = await client.healthCheck();

      expect(typeof health).toBe('boolean');
    });

    it('应该能够调用多个不同的 Agent', async () => {
      const client = new OpenClawClient();

      const longyarenResult = await client.spawn({
        agent: 'longyaren',
        input: '分析数据',
      });

      const searchResult = await client.spawn({
        agent: 'search',
        input: '搜索',
      });

      const browserResult = await client.spawn({
        agent: 'browser',
        input: '打开网页',
      });

      expect(longyarenResult.success).toBe(true);
      expect(searchResult.success).toBe(true);
      expect(browserResult.success).toBe(true);
    });
  });

  describe('多 Agent 协作流程', () => {
    it('应该按正确顺序执行依赖任务', () => {
      const subtasks: Partial<Subtask>[] = [
        { id: '1', description: '搜索数据', dependsOn: [] },
        { id: '2', description: '分析数据', dependsOn: ['1'] },
      ];

      const plan = scheduler.buildExecutionPlan(subtasks as Subtask[]);
      
      expect(plan.stages).toHaveLength(2);
      expect(plan.stages[0]).toHaveLength(1);
      expect(plan.stages[1]).toHaveLength(1);
    });

    it('应该能够执行并行任务', () => {
      const subtasks: Partial<Subtask>[] = [
        { id: '1', description: '搜索', dependsOn: [] },
        { id: '2', description: '代码开发', dependsOn: [] },
      ];

      const plan = scheduler.buildExecutionPlan(subtasks as Subtask[]);
      
      expect(plan.stages).toHaveLength(1);
      expect(plan.stages[0]).toHaveLength(2);
    });

    it('应该能够处理复杂的多阶段任务', () => {
      const subtasks: Partial<Subtask>[] = [
        { id: '1', description: '搜索', dependsOn: [] },
        { id: '2', description: '分析', dependsOn: ['1'] },
        { id: '3', description: '写代码', dependsOn: ['2'] },
        { id: '4', description: '测试', dependsOn: ['3'] },
      ];

      const plan = scheduler.buildExecutionPlan(subtasks as Subtask[]);
      
      // 应该是 4 个阶段：搜索 -> 分析 -> 写代码 -> 测试
      expect(plan.stages).toHaveLength(4);
    });
  });
});
