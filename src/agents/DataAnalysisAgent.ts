/**
 * 数据分析 Agent
 * 负责处理数据、生成统计摘要、检测异常值
 */

export interface AnalysisOptions {
  /** 分析类型 */
  type?: 'descriptive' | 'correlation' | 'trend' | 'comparison';
  /** 包含的统计指标 */
  metrics?: string[];
  /** 分组字段 */
  groupBy?: string;
  /** 过滤条件 */
  filters?: Record<string, any>;
}

export interface AnalysisResult {
  /** 分析结果数据 */
  data: any;
  /** 统计摘要 */
  summary: Summary;
  /** 异常值 */
  anomalies: Anomaly[];
  /** 图表配置 */
  charts?: ChartConfig[];
}

export interface Summary {
  /** 总数 */
  count: number;
  /** 平均值 */
  mean?: number;
  /** 中位数 */
  median?: number;
  /** 标准差 */
  std?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 分位数 */
  percentiles?: Record<string, number>;
  /** 分布统计 */
  distribution?: Record<string, number>;
}

export interface Anomaly {
  /** 异常值索引 */
  index: number;
  /** 异常值 */
  value: number | null | undefined;
  /** 异常类型 */
  type: 'outlier' | 'missing' | 'invalid';
  /** 严重程度 */
  severity: 'low' | 'medium' | 'high';
  /** 描述 */
  description?: string;
}

export interface ChartConfig {
  /** 图表类型 */
  type: ChartType;
  /** 图表标题 */
  title: string;
  /** X轴字段 */
  xField: string;
  /** Y轴字段 */
  yField: string;
  /** 分组字段 */
  groupField?: string;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'histogram';

export class DataAnalysisAgent {
  /**
   * 分析数据
   */
  async analyze(data: any[], options: AnalysisOptions = {}): Promise<AnalysisResult> {
    const { type = 'descriptive', metrics, groupBy, filters } = options;

    // 数据预处理
    let processedData = this.preprocessData(data, filters);

    // 生成统计摘要
    const summary = this.generateSummary(processedData);

    // 检测异常值
    const anomalies = this.detectAnomalies(processedData);

    // 根据分析类型生成图表配置
    const charts = this.generateChartConfigs(processedData, type, groupBy);

    return {
      data: processedData,
      summary,
      anomalies,
      charts,
    };
  }

  /**
   * 生成统计摘要
   */
  generateSummary(data: any[]): Summary {
    if (!data || data.length === 0) {
      return { count: 0 };
    }

    // 提取数值型字段
    const numericFields = this.getNumericFields(data);

    const summary: Summary = {
      count: data.length,
    };

    if (numericFields.length > 0) {
      const values = data.map((item) => item[numericFields[0]]).filter((v) => typeof v === 'number') as number[];

      if (values.length > 0) {
        summary.mean = this.calculateMean(values);
        summary.median = this.calculateMedian(values);
        summary.std = this.calculateStd(values);
        summary.min = Math.min(...values);
        summary.max = Math.max(...values);
        summary.percentiles = {
          q25: this.calculatePercentile(values, 25),
          q50: this.calculatePercentile(values, 50),
          q75: this.calculatePercentile(values, 75),
        };
      }
    }

    // 计算分布
    summary.distribution = this.calculateDistribution(data);

    return summary;
  }

  /**
   * 检测异常值
   */
  detectAnomalies(data: any[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const numericFields = this.getNumericFields(data);

    for (const field of numericFields) {
      const values = data
        .map((item, index) => ({ value: item[field], index }))
        .filter((item) => typeof item.value === 'number' && !isNaN(item.value));

      if (values.length === 0) continue;

      const numericValues = values.map((v) => v.value);
      
      // 使用 IQR 方法检测异常值 (更稳健)
      const q1 = this.calculatePercentile(numericValues, 25);
      const q3 = this.calculatePercentile(numericValues, 75);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      for (const { value, index } of values) {
        const isOutlier = value < lowerBound || value > upperBound;
        if (isOutlier) {
          const deviation = Math.max(Math.abs(value - lowerBound), Math.abs(value - upperBound));
          anomalies.push({
            index,
            value,
            type: 'outlier',
            severity: deviation > iqr * 2 ? 'high' : 'medium',
            description: `异常值: ${value} (范围: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
          });
        }
      }
    }

    // 检测缺失值
    for (let i = 0; i < data.length; i++) {
      for (const key of Object.keys(data[i])) {
        if (data[i][key] === null || data[i][key] === undefined || data[i][key] === '') {
          anomalies.push({
            index: i,
            value: data[i][key],
            type: 'missing',
            severity: 'low',
            description: `字段 ${key} 缺失值`,
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * 数据预处理
   */
  private preprocessData(data: any[], filters?: Record<string, any>): any[] {
    if (!filters) return data;

    return data.filter((item) => {
      for (const [key, value] of Object.entries(filters)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  /**
   * 获取数值型字段 (排除 id 字段)
   */
  private getNumericFields(data: any[]): string[] {
    if (!data || data.length === 0) return [];

    const fields = Object.keys(data[0]);
    return fields
      .filter((field) => {
        const value = data[0][field];
        // 排除 id 字段
        if (field.toLowerCase() === 'id') return false;
        return typeof value === 'number';
      })
      .sort((a, b) => {
        // 优先选择非 id 的第一个字段
        if (a === 'id') return 1;
        if (b === 'id') return -1;
        return 0;
      });
  }

  /**
   * 计算平均值
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * 计算中位数
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * 计算标准差
   */
  private calculateStd(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
  }

  /**
   * 计算分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  /**
   * 计算分布
   */
  private calculateDistribution(data: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const item of data) {
      for (const [key, value] of Object.entries(item)) {
        const strValue = String(value);
        distribution[strValue] = (distribution[strValue] || 0) + 1;
      }
    }

    return distribution;
  }

  /**
   * 生成图表配置
   */
  private generateChartConfigs(
    data: any[],
    type: string,
    groupBy?: string
  ): ChartConfig[] {
    const charts: ChartConfig[] = [];
    const numericFields = this.getNumericFields(data);

    if (numericFields.length > 0) {
      charts.push({
        type: 'line',
        title: '趋势图',
        xField: 'index',
        yField: numericFields[0],
      });

      charts.push({
        type: 'bar',
        title: '柱状图',
        xField: 'index',
        yField: numericFields[0],
      });
    }

    return charts;
  }
}

export default DataAnalysisAgent;
