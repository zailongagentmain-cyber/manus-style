/**
 * 报告生成器
 * 支持 Markdown 和 HTML 格式报告生成
 */

import { Summary, Anomaly, ChartConfig } from '../../agents/DataAnalysisAgent';

export interface ReportData {
  /** 报告标题 */
  title: string;
  /** 报告描述 */
  description?: string;
  /** 分析数据 */
  data?: any[];
  /** 统计摘要 */
  summary?: Summary;
  /** 异常值 */
  anomalies?: Anomaly[];
  /** 图表配置 */
  charts?: ChartConfig[];
  /** 生成时间 */
  timestamp?: Date;
  /** 自定义内容 */
  customContent?: string;
}

export interface ReportOptions {
  /** 报告格式 */
  format: 'markdown' | 'html';
  /** 是否包含图表 */
  includeCharts?: boolean;
  /** 是否包含异常值 */
  includeAnomalies?: boolean;
  /** 是否包含原始数据 */
  includeData?: boolean;
  /** 主题样式 */
  theme?: 'light' | 'dark';
}

export class ReportGenerator {
  private defaultTheme = 'light';

  /**
   * 生成 Markdown 报告
   */
  generateMarkdown(data: ReportData): string {
    const { title, description, summary, anomalies, charts, data: reportData, timestamp, customContent } = data;

    let md = `# ${title}\n\n`;

    if (description) {
      md += `${description}\n\n`;
    }

    // 添加时间戳
    md += `> 生成时间: ${timestamp ? timestamp.toISOString() : new Date().toISOString()}\n\n`;

    // 目录
    md += `## 目录\n`;
    md += `1. [统计摘要](#统计摘要)\n`;
    if (anomalies && anomalies.length > 0) {
      md += `2. [异常值分析](#异常值分析)\n`;
    }
    if (charts && charts.length > 0) {
      md += `${anomalies && anomalies.length > 0 ? '3' : '2'}. [图表](#图表)\n`;
    }
    if (reportData && reportData.length > 0) {
      md += `${(anomalies?.length || 0) > 0 || (charts?.length || 0) > 0 ? (charts?.length || 0) + 2 : 2}. [原始数据](#原始数据)\n`;
    }
    md += `\n---\n\n`;

    // 统计摘要
    if (summary) {
      md += this.generateSummarySection(summary);
    }

    // 异常值分析
    if (anomalies && anomalies.length > 0) {
      md += this.generateAnomalySection(anomalies);
    }

    // 图表
    if (charts && charts.length > 0) {
      md += this.generateChartsSection(charts);
    }

    // 原始数据
    if (reportData && reportData.length > 0) {
      md += this.generateDataSection(reportData);
    }

    // 自定义内容
    if (customContent) {
      md += `\n---\n\n${customContent}\n`;
    }

    return md;
  }

  /**
   * 生成 HTML 报告
   */
  generateHTML(data: ReportData): string {
    const { title, description, summary, anomalies, charts, data: reportData, timestamp, customContent } = data;

    const theme = this.defaultTheme;
    const bgColor = theme === 'light' ? '#ffffff' : '#1a1a1a';
    const textColor = theme === 'light' ? '#333333' : '#e0e0e0';
    const accentColor = '#1890ff';
    const borderColor = theme === 'light' ? '#e8e8e8' : '#333333';

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      line-height: 1.6;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { color: ${accentColor}; margin-bottom: 20px; font-size: 2em; }
    h2 { color: ${textColor}; margin: 30px 0 15px; font-size: 1.5em; border-bottom: 2px solid ${accentColor}; padding-bottom: 8px; }
    h3 { color: ${textColor}; margin: 20px 0 10px; font-size: 1.2em; }
    p { margin-bottom: 15px; }
    .meta { color: #888; font-size: 0.9em; margin-bottom: 30px; }
    .card {
      background: ${theme === 'light' ? '#fafafa' : '#252525'};
      border: 1px solid ${borderColor};
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-item {
      background: ${theme === 'light' ? '#fff' : '#2a2a2a'};
      border: 1px solid ${borderColor};
      border-radius: 6px;
      padding: 15px;
      text-align: center;
    }
    .stat-label { color: #888; font-size: 0.85em; margin-bottom: 5px; }
    .stat-value { font-size: 1.5em; font-weight: bold; color: ${accentColor}; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid ${borderColor};
      padding: 12px;
      text-align: left;
    }
    th { background: ${accentColor}; color: white; }
    tr:nth-child(even) { background: ${theme === 'light' ? '#f5f5f5' : '#2a2a2a'}; }
    .warning { color: #faad14; }
    .danger { color: #f5222d; }
    .success { color: #52c41a; }
    code {
      background: ${theme === 'light' ? '#f5f5f5' : '#2a2a2a'};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    pre {
      background: ${theme === 'light' ? '#f5f5f5' : '#2a2a2a'};
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
    }
    ul, ol { margin-left: 20px; margin-bottom: 15px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
`;

    if (description) {
      html += `  <p>${description}</p>\n`;
    }

    html += `  <p class="meta">生成时间: ${timestamp ? timestamp.toISOString() : new Date().toISOString()}</p>\n`;

    // 统计摘要
    if (summary) {
      html += this.generateSummarySectionHTML(summary, theme);
    }

    // 异常值分析
    if (anomalies && anomalies.length > 0) {
      html += this.generateAnomalySectionHTML(anomalies, theme);
    }

    // 图表
    if (charts && charts.length > 0) {
      html += this.generateChartsSectionHTML(charts, theme);
    }

    // 原始数据
    if (reportData && reportData.length > 0) {
      html += this.generateDataSectionHTML(reportData, theme);
    }

    // 自定义内容
    if (customContent) {
      html += `  <div class="card">${customContent}</div>\n`;
    }

    html += `</body>\n</html>`;

    return html;
  }

  /**
   * 生成完整的报告
   */
  generate(data: ReportData, options: ReportOptions): string {
    const { format = 'markdown' } = options;

    if (format === 'html') {
      return this.generateHTML(data);
    }

    return this.generateMarkdown(data);
  }

  /**
   * 生成统计摘要章节 (Markdown)
   */
  private generateSummarySection(summary: Summary): string {
    let md = `## 统计摘要\n\n`;

    md += `<div class="card">\n\n`;
    md += `| 指标 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 数据总量 | ${summary.count} |\n`;

    if (summary.mean !== undefined) {
      md += `| 平均值 | ${summary.mean.toFixed(2)} |\n`;
    }
    if (summary.median !== undefined) {
      md += `| 中位数 | ${summary.median.toFixed(2)} |\n`;
    }
    if (summary.std !== undefined) {
      md += `| 标准差 | ${summary.std.toFixed(2)} |\n`;
    }
    if (summary.min !== undefined) {
      md += `| 最小值 | ${summary.min.toFixed(2)} |\n`;
    }
    if (summary.max !== undefined) {
      md += `| 最大值 | ${summary.max.toFixed(2)} |\n`;
    }

    md += `</div>\n\n`;

    // 分位数
    if (summary.percentiles) {
      md += `### 分位数\n\n`;
      md += `| 分位 | 值 |\n`;
      md += `|------|-----|\n`;
      for (const [key, value] of Object.entries(summary.percentiles)) {
        md += `| ${key} | ${value.toFixed(2)} |\n`;
      }
      md += `\n`;
    }

    return md;
  }

  /**
   * 生成异常值章节 (Markdown)
   */
  private generateAnomalySection(anomalies: Anomaly[]): string {
    let md = `## 异常值分析\n\n`;
    md += `共检测到 **${anomalies.length}** 个异常值\n\n`;

    md += `| 索引 | 值 | 类型 | 严重程度 | 描述 |\n`;
    md += `|------|-----|------|----------|------|\n`;

    for (const anomaly of anomalies) {
      const severityIcon = {
        low: '🟢',
        medium: '🟡',
        high: '🔴',
      }[anomaly.severity];

      md += `| ${anomaly.index} | ${anomaly.value} | ${anomaly.type} | ${severityIcon} ${anomaly.severity} | ${anomaly.description || '-'} |\n`;
    }

    md += `\n`;
    return md;
  }

  /**
   * 生成图表章节 (Markdown)
   */
  private generateChartsSection(charts: ChartConfig[]): string {
    let md = `## 图表\n\n`;

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      md += `### ${i + 1}. ${chart.title}\n\n`;
      md += `- 类型: ${chart.type}\n`;
      md += `- X轴: ${chart.xField}\n`;
      md += `- Y轴: ${chart.yField}\n`;
      if (chart.groupField) {
        md += `- 分组: ${chart.groupField}\n`;
      }
      md += `\n`;
    }

    return md;
  }

  /**
   * 生成数据章节 (Markdown)
   */
  private generateDataSection(data: any[]): string {
    let md = `## 原始数据\n\n`;
    md += `共 ${data.length} 条记录\n\n`;

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      md += `| ${keys.join(' | ')} |\n`;
      md += `| ${keys.map(() => '---').join(' | ')} |\n`;

      const maxRows = 10;
      for (let i = 0; i < Math.min(data.length, maxRows); i++) {
        md += `| ${keys.map((k) => data[i][k]).join(' | ')} |\n`;
      }

      if (data.length > maxRows) {
        md += `\n*...还有 ${data.length - maxRows} 条记录*\n`;
      }
    }

    return md;
  }

  /**
   * 生成统计摘要章节 (HTML)
   */
  private generateSummarySectionHTML(summary: Summary, theme: string): string {
    let html = `  <h2>统计摘要</h2>\n`;
    html += `  <div class="card">\n`;
    html += `    <div class="stat-grid">\n`;

    html += `      <div class="stat-item">\n`;
    html += `        <div class="stat-label">数据总量</div>\n`;
    html += `        <div class="stat-value">${summary.count}</div>\n`;
    html += `      </div>\n`;

    if (summary.mean !== undefined) {
      html += `      <div class="stat-item">\n`;
      html += `        <div class="stat-label">平均值</div>\n`;
      html += `        <div class="stat-value">${summary.mean.toFixed(2)}</div>\n`;
      html += `      </div>\n`;
    }

    if (summary.median !== undefined) {
      html += `      <div class="stat-item">\n`;
      html += `        <div class="stat-label">中位数</div>\n`;
      html += `        <div class="stat-value">${summary.median.toFixed(2)}</div>\n`;
      html += `      </div>\n`;
    }

    if (summary.std !== undefined) {
      html += `      <div class="stat-item">\n`;
      html += `        <div class="stat-label">标准差</div>\n`;
      html += `        <div class="stat-value">${summary.std.toFixed(2)}</div>\n`;
      html += `      </div>\n`;
    }

    if (summary.min !== undefined) {
      html += `      <div class="stat-item">\n`;
      html += `        <div class="stat-label">最小值</div>\n`;
      html += `        <div class="stat-value">${summary.min.toFixed(2)}</div>\n`;
      html += `      </div>\n`;
    }

    if (summary.max !== undefined) {
      html += `      <div class="stat-item">\n`;
      html += `        <div class="stat-label">最大值</div>\n`;
      html += `        <div class="stat-value">${summary.max.toFixed(2)}</div>\n`;
      html += `      </div>\n`;
    }

    html += `    </div>\n`;
    html += `  </div>\n`;

    return html;
  }

  /**
   * 生成异常值章节 (HTML)
   */
  private generateAnomalySectionHTML(anomalies: Anomaly[], theme: string): string {
    let html = `  <h2>异常值分析</h2>\n`;
    html += `  <p>共检测到 <strong>${anomalies.length}</strong> 个异常值</p>\n`;

    const severityClass = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
    };

    html += `  <table>\n`;
    html += `    <thead>\n`;
    html += `      <tr><th>索引</th><th>值</th><th>类型</th><th>严重程度</th><th>描述</th></tr>\n`;
    html += `    </thead>\n`;
    html += `    <tbody>\n`;

    for (const anomaly of anomalies) {
      html += `      <tr>\n`;
      html += `        <td>${anomaly.index}</td>\n`;
      html += `        <td>${anomaly.value}</td>\n`;
      html += `        <td>${anomaly.type}</td>\n`;
      html += `        <td class="${severityClass[anomaly.severity]}">${anomaly.severity}</td>\n`;
      html += `        <td>${anomaly.description || '-'}</td>\n`;
      html += `      </tr>\n`;
    }

    html += `    </tbody>\n`;
    html += `  </table>\n`;

    return html;
  }

  /**
   * 生成图表章节 (HTML)
   */
  private generateChartsSectionHTML(charts: ChartConfig[], theme: string): string {
    let html = `  <h2>图表</h2>\n`;

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      html += `  <div class="card">\n`;
      html += `    <h3>${i + 1}. ${chart.title}</h3>\n`;
      html += `    <p>类型: <code>${chart.type}</code></p>\n`;
      html += `    <p>X轴: <code>${chart.xField}</code></p>\n`;
      html += `    <p>Y轴: <code>${chart.yField}</code></p>\n`;
      if (chart.groupField) {
        html += `    <p>分组: <code>${chart.groupField}</code></p>\n`;
      }
      html += `  </div>\n`;
    }

    return html;
  }

  /**
   * 生成数据章节 (HTML)
   */
  private generateDataSectionHTML(data: any[], theme: string): string {
    let html = `  <h2>原始数据</h2>\n`;
    html += `  <p>共 ${data.length} 条记录</p>\n`;

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      html += `  <table>\n`;
      html += `    <thead><tr>`;
      for (const key of keys) {
        html += `<th>${key}</th>`;
      }
      html += `</tr></thead>\n`;
      html += `    <tbody>\n`;

      const maxRows = 10;
      for (let i = 0; i < Math.min(data.length, maxRows); i++) {
        html += `      <tr>`;
        for (const key of keys) {
          html += `<td>${data[i][key]}</td>`;
        }
        html += `</tr>\n`;
      }

      html += `    </tbody>\n`;
      html += `  </table>\n`;

      if (data.length > maxRows) {
        html += `  <p><em>...还有 ${data.length - maxRows} 条记录</em></p>\n`;
      }
    }

    return html;
  }
}

export default ReportGenerator;
