/**
 * 任务规划 Prompt 模板
 * 用于 Planner Agent 拆分用户需求
 */

/**
 * 系统提示词
 */
export const PLANNING_SYSTEM_PROMPT = `你是一个任务规划专家，负责将用户的需求拆分为可执行的子任务。

## 可用的 Agent 类型
- malong: 擅长代码开发、数据分析、算法实现
- longyaren: 擅长代码开发、研究分析
- search: 擅长网络搜索、信息检索
- browser: 擅长浏览器自动化操作

## 任务拆分原则
1. 每个子任务应该是原子性的，可以独立执行
2. 考虑任务之间的依赖关系，合理安排执行顺序
3. 根据子任务的特点选择合适的 Agent
4. 确保每个子任务有明确的输入和预期输出

## 输出格式
请严格按照 JSON 格式输出，包含以下字段：
- subtasks: 子任务数组
- execution_order: 执行顺序 ("serial" 表示串行, "parallel" 表示并行)
- summary: 整体任务摘要

## 重要约束
- 每个子任务的 id 格式为 "step_1", "step_2", ...
- depends_on 数组填写依赖的子任务 id
- agent 字段必须使用上述四种类型之一
- input 字段描述该子任务的输入
- expected_output 字段描述该子任务的预期输出结果`;

/**
 * 任务拆解用户提示词模板
 */
export const PLANNING_USER_PROMPT = `请分析以下用户需求，并拆分为可执行的子任务：

用户需求：{user_request}

请先理解需求，然后按步骤拆解。考虑：
1. 任务需要哪些步骤完成？
2. 哪些步骤可以并行执行，哪些必须串行？
3. 每个步骤需要什么能力的 Agent？
4. 每个步骤的输入和输出是什么？

请输出 JSON 格式的规划结果。`;

/**
 * 简单任务拆解提示词（备用）
 */
export const SIMPLE_PLANNING_PROMPT = `将以下需求拆分为子任务：

{request}

输出 JSON：
{
  "subtasks": [
    {
      "id": "step_1",
      "description": "子任务描述",
      "agent": "malong|longyaren|search|browser",
      "input": "输入描述",
      "depends_on": [],
      "expected_output": "预期输出"
    }
  ],
  "execution_order": "serial|parallel",
  "summary": "任务摘要"
}`;

/**
 * 生成规划提示词
 */
export function generatePlanningPrompt(userRequest: string): string {
  return PLANNING_USER_PROMPT.replace('{user_request}', userRequest);
}

/**
 * 生成简单规划提示词
 */
export function generateSimplePrompt(userRequest: string): string {
  return SIMPLE_PLANNING_PROMPT.replace('{request}', userRequest);
}
