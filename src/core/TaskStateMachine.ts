/**
 * Task State Machine - 状态转换逻辑
 */

import { TaskStatus, ALLOWED_TRANSITIONS } from '../types/task';

export class TaskStateMachine {
  /**
   * 验证状态转换是否合法
   */
  static canTransition(from: TaskStatus, to: TaskStatus): boolean {
    const allowedTransitions = ALLOWED_TRANSITIONS[from];
    return allowedTransitions ? allowedTransitions.includes(to) : false;
  }

  /**
   * 执行状态转换，如果非法则抛出错误
   */
  static transition(from: TaskStatus, to: TaskStatus): TaskStatus {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid state transition from '${from}' to '${to}'. ` +
        `Allowed transitions from '${from}': [${ALLOWED_TRANSITIONS[from]?.join(', ') || 'none'}]`
      );
    }
    return to;
  }

  /**
   * 获取当前状态可用的所有转换
   */
  static getAvailableTransitions(from: TaskStatus): TaskStatus[] {
    return ALLOWED_TRANSITIONS[from] || [];
  }

  /**
   * 检查任务是否处于终态
   */
  static isFinalStatus(status: TaskStatus): boolean {
    return status === TaskStatus.COMPLETED || status === TaskStatus.FAILED;
  }

  /**
   * 检查任务是否处于活跃状态
   */
  static isActiveStatus(status: TaskStatus): boolean {
    return status === TaskStatus.RUNNING || status === TaskStatus.PAUSED;
  }

  /**
   * 验证状态是否有效
   */
  static isValidStatus(status: string): boolean {
    return Object.values(TaskStatus).includes(status as TaskStatus);
  }
}
