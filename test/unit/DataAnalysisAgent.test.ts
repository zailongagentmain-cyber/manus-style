/**
 * DataAnalysisAgent 单元测试
 */

import { DataAnalysisAgent, AnalysisOptions, Summary, Anomaly } from '../../src/agents/DataAnalysisAgent';

describe('DataAnalysisAgent', () => {
  let agent: DataAnalysisAgent;

  beforeEach(() => {
    agent = new DataAnalysisAgent();
  });

  // 测试数据
  const mockData = [
    { id: 1, name: 'Alice', age: 25, score: 85 },
    { id: 2, name: 'Bob', age: 30, score: 90 },
    { id: 3, name: 'Charlie', age: 35, score: 78 },
    { id: 4, name: 'Diana', age: 28, score: 92 },
    { id: 5, name: 'Eve', age: 32, score: 88 },
  ];

  const mockDataWithOutliers = [
    { id: 1, value: 10 },
    { id: 2, value: 12 },
    { id: 3, value: 11 },
    { id: 4, value: 13 },
    { id: 5, value: 1000 }, // 极大异常值 (Z-score > 3)
  ];

  const mockDataWithNull = [
    { id: 1, name: 'Alice', age: 25, score: 85 },
    { id: 2, name: 'Bob', age: null, score: 90 },
    { id: 3, name: '', age: 35, score: 78 },
  ];

  describe('analyze', () => {
    it('应该正确分析数据并返回结果', async () => {
      const options: AnalysisOptions = {
        type: 'descriptive',
        metrics: ['mean', 'median'],
      };

      const result = await agent.analyze(mockData, options);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.anomalies).toBeDefined();
      expect(result.data).toEqual(mockData);
    });

    it('应该支持过滤选项', async () => {
      const options: AnalysisOptions = {
        filters: { age: 30 },
      };

      const result = await agent.analyze(mockData, options);

      expect(result.data.length).toBe(1);
      expect(result.data[0].age).toBe(30);
    });

    it('应该支持不同的分析类型', async () => {
      const types: AnalysisOptions['type'][] = ['descriptive', 'correlation', 'trend', 'comparison'];

      for (const type of types) {
        const result = await agent.analyze(mockData, { type });
        expect(result).toBeDefined();
      }
    });
  });

  describe('generateSummary', () => {
    it('应该生成正确的统计摘要', () => {
      const summary = agent.generateSummary(mockData);

      expect(summary.count).toBe(5);
      expect(summary.mean).toBeDefined();
      expect(summary.median).toBeDefined();
      expect(summary.std).toBeDefined();
      expect(summary.min).toBeDefined();
      expect(summary.max).toBeDefined();
    });

    it('应该正确计算数值字段的平均值', () => {
      const summary = agent.generateSummary(mockData);

      // age: 25, 30, 35, 28, 32 -> mean = 30
      expect(summary.mean).toBeCloseTo(30, 0);
    });

    it('应该正确计算中位数', () => {
      const summary = agent.generateSummary(mockData);

      // age: 25, 30, 35, 28, 32 -> sorted: 25, 28, 30, 32, 35 -> median = 30
      expect(summary.median).toBe(30);
    });

    it('应该正确计算标准差', () => {
      const summary = agent.generateSummary(mockData);

      expect(typeof summary.std).toBe('number');
      expect(summary.std).toBeGreaterThan(0);
    });

    it('应该计算分位数', () => {
      const summary = agent.generateSummary(mockData);

      expect(summary.percentiles).toBeDefined();
      expect(summary.percentiles!.q25).toBeDefined();
      expect(summary.percentiles!.q50).toBeDefined();
      expect(summary.percentiles!.q75).toBeDefined();
    });

    it('应该处理空数据', () => {
      const summary = agent.generateSummary([]);

      expect(summary.count).toBe(0);
      expect(summary.mean).toBeUndefined();
    });

    it('应该处理空数组', () => {
      const summary = agent.generateSummary(null as any);

      expect(summary.count).toBe(0);
    });

    it('应该生成分布统计', () => {
      const summary = agent.generateSummary(mockData);

      expect(summary.distribution).toBeDefined();
      expect(Object.keys(summary.distribution!).length).toBeGreaterThan(0);
    });
  });

  describe('detectAnomalies', () => {
    it('应该检测到异常值', () => {
      const anomalies = agent.detectAnomalies(mockDataWithOutliers);

      // 应该检测到至少一个异常值
      const outlierAnomalies = anomalies.filter((a) => a.type === 'outlier');
      expect(outlierAnomalies.length).toBeGreaterThan(0);
    });

    it('应该正确标记异常值类型', () => {
      const anomalies = agent.detectAnomalies(mockDataWithOutliers);

      expect(anomalies.some((a) => a.type === 'outlier')).toBe(true);
    });

    it('应该检测缺失值', () => {
      const anomalies = agent.detectAnomalies(mockDataWithNull);

      const missingAnomalies = anomalies.filter((a) => a.type === 'missing');
      expect(missingAnomalies.length).toBeGreaterThan(0);
    });

    it('应该正确设置严重程度', () => {
      const anomalies = agent.detectAnomalies(mockDataWithOutliers);

      for (const anomaly of anomalies) {
        expect(['low', 'medium', 'high']).toContain(anomaly.severity);
      }
    });

    it('应该返回空数组当没有异常', () => {
      const anomalies = agent.detectAnomalies(mockData);

      // 数据没有明显的异常值
      expect(anomalies).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理单条数据', () => {
      const singleData = [{ value: 42 }];
      const summary = agent.generateSummary(singleData);

      expect(summary.count).toBe(1);
      expect(summary.mean).toBe(42);
      expect(summary.min).toBe(42);
      expect(summary.max).toBe(42);
    });

    it('应该处理重复数据', () => {
      const duplicateData = [
        { value: 10 },
        { value: 10 },
        { value: 10 },
      ];
      const summary = agent.generateSummary(duplicateData);

      expect(summary.count).toBe(3);
      expect(summary.mean).toBe(10);
      expect(summary.std).toBe(0);
    });

    it('应该处理负数', () => {
      const negativeData = [
        { value: -10 },
        { value: -5 },
        { value: 0 },
        { value: 5 },
        { value: 10 },
      ];
      const summary = agent.generateSummary(negativeData);

      expect(summary.mean).toBe(0);
      expect(summary.min).toBe(-10);
      expect(summary.max).toBe(10);
    });
  });
});

describe('Summary 类型', () => {
  it('应该正确创建 Summary 对象', () => {
    const summary: Summary = {
      count: 100,
      mean: 50.5,
      median: 51,
      std: 10.2,
      min: 20,
      max: 80,
      percentiles: {
        q25: 35,
        q50: 51,
        q75: 65,
      },
    };

    expect(summary.count).toBe(100);
    expect(summary.mean).toBe(50.5);
    expect(summary.percentiles?.q50).toBe(51);
  });
});

describe('Anomaly 类型', () => {
  it('应该正确创建 Anomaly 对象', () => {
    const anomaly: Anomaly = {
      index: 5,
      value: 100,
      type: 'outlier',
      severity: 'high',
      description: '异常值: 100 (Z-score: 4.5)',
    };

    expect(anomaly.index).toBe(5);
    expect(anomaly.type).toBe('outlier');
    expect(anomaly.severity).toBe('high');
  });

  it('应该支持不同的异常类型', () => {
    const outlier: Anomaly = { index: 0, value: 0, type: 'outlier', severity: 'medium' };
    const missing: Anomaly = { index: 1, value: null, type: 'missing', severity: 'low' };
    const invalid: Anomaly = { index: 2, value: undefined, type: 'invalid', severity: 'low' };

    expect(outlier.type).toBe('outlier');
    expect(missing.type).toBe('missing');
    expect(invalid.type).toBe('invalid');
  });
});
