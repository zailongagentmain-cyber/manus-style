/**
 * 可视化图表生成器
 * 支持多种图表类型生成
 */

export interface ChartData {
  /** 图表数据 */
  data: any[];
  /** X轴数据字段 */
  xField: string;
  /** Y轴数据字段 */
  yField: string;
  /** 分组字段 */
  groupField?: string;
  /** 系列名称 */
  seriesName?: string;
}

export interface ChartOptions {
  /** 图表类型 */
  type: ChartType;
  /** 图表标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** X轴标签 */
  xAxisLabel?: string;
  /** Y轴标签 */
  yAxisLabel?: string;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 颜色 */
  colors?: string[];
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 是否显示网格 */
  showGrid?: boolean;
  /** 是否显示数据标签 */
  showDataLabel?: boolean;
  /** 动画效果 */
  animation?: boolean;
  /** 主题 */
  theme?: 'light' | 'dark';
}

export interface ChartResult {
  /** 图表类型 */
  type: ChartType;
  /** 图表配置 (Recharts 格式) */
  config: any;
  /** 图表数据 */
  data: any[];
  /** 图表选项 */
  options: ChartOptions;
  /** 生成的 SVG/HTML */
  markup?: string;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'histogram' | 'radar' | 'gauge';

export interface ChartTypeInfo {
  /** 类型名称 */
  name: ChartType;
  /** 显示名称 */
  displayName: string;
  /** 描述 */
  description: string;
}

export class ChartGenerator {
  private defaultColors = [
    '#1890ff',
    '#52c41a',
    '#faad14',
    '#f5222d',
    '#722ed1',
    '#13c2c2',
    '#eb2f96',
    '#fa8c16',
  ];

  private defaultWidth = 800;
  private defaultHeight = 400;

  /**
   * 生成图表
   */
  async generateChart(data: ChartData, options: ChartOptions): Promise<ChartResult> {
    const { type } = options;
    const chartOptions = this.mergeOptions(options);

    let config: any;

    switch (type) {
      case 'line':
        config = this.generateLineChartConfig(data, chartOptions);
        break;
      case 'bar':
        config = this.generateBarChartConfig(data, chartOptions);
        break;
      case 'pie':
        config = this.generatePieChartConfig(data, chartOptions);
        break;
      case 'scatter':
        config = this.generateScatterChartConfig(data, chartOptions);
        break;
      case 'area':
        config = this.generateAreaChartConfig(data, chartOptions);
        break;
      case 'histogram':
        config = this.generateHistogramConfig(data, chartOptions);
        break;
      default:
        config = this.generateBarChartConfig(data, chartOptions);
    }

    return {
      type,
      config,
      data: data.data,
      options: chartOptions,
    };
  }

  /**
   * 获取支持的图表类型
   */
  getSupportedTypes(): ChartTypeInfo[] {
    return [
      {
        name: 'line',
        displayName: '折线图',
        description: '展示数据趋势变化',
      },
      {
        name: 'bar',
        displayName: '柱状图',
        description: '比较不同类别的数据',
      },
      {
        name: 'pie',
        displayName: '饼图',
        description: '展示占比分布',
      },
      {
        name: 'scatter',
        displayName: '散点图',
        description: '展示数据相关性',
      },
      {
        name: 'area',
        displayName: '面积图',
        description: '展示累积数据变化',
      },
      {
        name: 'histogram',
        displayName: '直方图',
        description: '展示数据分布',
      },
    ];
  }

  /**
   * 生成折线图配置
   */
  private generateLineChartConfig(data: ChartData, options: ChartOptions): any {
    return {
      chartType: 'line',
      title: options.title || '折线图',
      width: options.width || this.defaultWidth,
      height: options.height || this.defaultHeight,
      xField: data.xField,
      yField: data.yField,
      seriesField: data.groupField,
      smooth: true,
      animation: options.animation ?? true,
      xAxis: {
        label: options.xAxisLabel,
        grid: options.showGrid ?? true,
      },
      yAxis: {
        label: options.yAxisLabel,
        grid: options.showGrid ?? true,
      },
      legend: options.showLegend ?? true,
      color: options.colors || this.defaultColors,
    };
  }

  /**
   * 生成柱状图配置
   */
  private generateBarChartConfig(data: ChartData, options: ChartOptions): any {
    return {
      chartType: 'bar',
      title: options.title || '柱状图',
      width: options.width || this.defaultWidth,
      height: options.height || this.defaultHeight,
      xField: data.xField,
      yField: data.yField,
      seriesField: data.groupField,
      animation: options.animation ?? true,
      xAxis: {
        label: options.xAxisLabel,
        grid: options.showGrid ?? false,
      },
      yAxis: {
        label: options.yAxisLabel,
        grid: options.showGrid ?? true,
      },
      legend: options.showLegend ?? true,
      color: options.colors || this.defaultColors,
      label: options.showDataLabel
        ? {
            position: 'top',
          }
        : null,
    };
  }

  /**
   * 生成饼图配置
   */
  private generatePieChartConfig(data: ChartData, options: ChartOptions): any {
    return {
      chartType: 'pie',
      title: options.title || '饼图',
      width: options.width || this.defaultWidth,
      height: options.height || this.defaultHeight,
      angleField: data.yField,
      colorField: data.xField,
      radius: 0.8,
      innerRadius: 0,
      animation: options.animation ?? true,
      legend: options.showLegend ?? true,
      color: options.colors || this.defaultColors,
      label: options.showDataLabel
        ? {
            type: 'outer',
            content: '{name}: {percentage}',
          }
        : null,
    };
  }

  /**
   * 生成散点图配置
   */
  private generateScatterChartConfig(data: ChartData, options: ChartOptions): any {
    return {
      chartType: 'scatter',
      title: options.title || '散点图',
      width: options.width || this.defaultWidth,
      height: options.height || this.defaultHeight,
      xField: data.xField,
      yField: data.yField,
      sizeField: data.groupField,
      animation: options.animation ?? true,
      xAxis: {
        label: options.xAxisLabel,
        grid: options.showGrid ?? true,
      },
      yAxis: {
        label: options.yAxisLabel,
        grid: options.showGrid ?? true,
      },
      color: options.colors || this.defaultColors,
    };
  }

  /**
   * 生成面积图配置
   */
  private generateAreaChartConfig(data: ChartData, options: ChartOptions): any {
    return {
      chartType: 'area',
      title: options.title || '面积图',
      width: options.width || this.defaultWidth,
      height: options.height || this.defaultHeight,
      xField: data.xField,
      yField: data.yField,
      seriesField: data.groupField,
      smooth: true,
      animation: options.animation ?? true,
      xAxis: {
        label: options.xAxisLabel,
        grid: options.showGrid ?? true,
      },
      yAxis: {
        label: options.yAxisLabel,
        grid: options.showGrid ?? true,
      },
      legend: options.showLegend ?? true,
      color: options.colors || this.defaultColors,
    };
  }

  /**
   * 生成直方图配置
   */
  private generateHistogramConfig(data: ChartData, options: ChartOptions): any {
    return {
      chartType: 'histogram',
      title: options.title || '直方图',
      width: options.width || this.defaultWidth,
      height: options.height || this.defaultHeight,
      xField: data.xField,
      yField: data.yField,
      binNumber: 10,
      animation: options.animation ?? true,
      xAxis: {
        label: options.xAxisLabel,
        grid: options.showGrid ?? false,
      },
      yAxis: {
        label: options.yAxisLabel,
        grid: options.showGrid ?? true,
      },
      color: options.colors?.[0] || this.defaultColors[0],
    };
  }

  /**
   * 合并默认选项
   */
  private mergeOptions(options: ChartOptions): ChartOptions {
    return {
      animation: true,
      showLegend: true,
      showGrid: true,
      showDataLabel: false,
      theme: 'light',
      ...options,
    };
  }

  /**
   * 生成 Recharts 格式的配置
   */
  generateRechartsConfig(data: ChartData, options: ChartOptions): any {
    const { type, title, colors, showGrid, showLegend } = this.mergeOptions(options);

    const baseConfig = {
      width: options.width || this.defaultWidth,
      height: options.height || this.defaultHeight,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (type) {
      case 'line':
        return {
          ...baseConfig,
          type: 'linear',
          data: data.data,
          margin: { top: 20, right: 30, left: 20, bottom: 20 },
          CartesianGrid: showGrid ? { strokeDasharray: '3 3' } : undefined,
          XAxis: { dataKey: data.xField },
          YAxis: {},
          Legend: showLegend ? {} : undefined,
          Tooltip: {},
          Line: {
            type: 'monotone',
            dataKey: data.yField,
            stroke: colors?.[0] || this.defaultColors[0],
            strokeWidth: 2,
          },
        };

      case 'bar':
        return {
          ...baseConfig,
          data: data.data,
          CartesianGrid: showGrid ? { strokeDasharray: '3 3' } : undefined,
          XAxis: { dataKey: data.xField },
          YAxis: {},
          Legend: showLegend ? {} : undefined,
          Tooltip: {},
          Bar: {
            dataKey: data.yField,
            fill: colors?.[0] || this.defaultColors[0],
          },
        };

      default:
        return baseConfig;
    }
  }
}

export default ChartGenerator;
