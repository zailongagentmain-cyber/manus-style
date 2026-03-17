import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 任务流程
 * 
 * 测试前端页面功能和结构：
 * 1. 页面加载
 * 2. 组件显示
 * 3. 用户交互
 */

test.describe('任务流程', () => {
  test.beforeEach(async ({ page }) => {
    // 打开前端页面
    await page.goto('/');
  });

  test('应该正确加载主页', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('.app-title')).toContainText('Manus Style');
    
    // 验证副标题
    await expect(page.locator('.app-subtitle')).toContainText('AI 任务执行系统');
    
    // 验证输入框存在
    await expect(page.locator('.task-input-field')).toBeVisible();
    
    // 验证提交按钮存在
    await expect(page.locator('.submit-button')).toBeVisible();
  });

  test('应该显示任务列表区域', async ({ page }) => {
    // 验证任务列表面板标题
    await expect(page.locator('.panel-title')).toContainText('任务列表');
    
    // 验证任务详情面板存在
    await expect(page.locator('.task-detail-panel, .task-detail')).toBeVisible();
  });

  test('应该能够在输入框输入内容', async ({ page }) => {
    const input = page.locator('.task-input-field');
    
    // 输入文本
    await input.fill('测试任务描述');
    
    // 验证输入的内容
    await expect(input).toHaveValue('测试任务描述');
  });

  test('应该显示空状态提示', async ({ page }) => {
    // 验证空状态显示
    const emptyState = page.locator('.task-list-empty');
    // 如果显示空状态则检查文字
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('暂无任务');
    }
  });
});
