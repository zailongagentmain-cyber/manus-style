/**
 * 数据处理工具集
 * 提供数据清洗、统计计算、数据转换等功能
 */

/**
 * 数据类型
 */
export type DataType = 'number' | 'string' | 'boolean' | 'date' | 'object';

/**
 * 字段信息
 */
export interface FieldInfo {
  name: string;
  type: DataType;
  nullable: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  mean?: number;
}

/**
 * 清洗选项
 */
export interface CleanOptions {
  /** 移除空值 */
  removeNull?: boolean;
  /** 移除重复项 */
  removeDuplicates?: boolean;
  /** 移除异常值 */
  removeOutliers?: boolean;
  /** 填充空值 */
  fillNull?: any;
  /** 转换类型 */
  convertTypes?: boolean;
  /** 修剪字符串 */
  trimStrings?: boolean;
}

/**
 * 聚合选项
 */
export interface AggregateOptions {
  /** 分组字段 */
  groupBy: string;
  /** 聚合字段 */
  field: string;
  /** 聚合方法 */
  method: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median';
}

/**
 * 数据范围
 */
export interface DataRange {
  min: number;
  max: number;
  count: number;
}

/**
 * 相关性结果
 */
export interface CorrelationResult {
  field1: string;
  field2: string;
  coefficient: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
}

/**
 * 数据处理工具类
 */
export class DataProcessor {
  /**
   * 数据清洗
   */
  static clean(data: any[], options: CleanOptions = {}): any[] {
    const {
      removeNull = true,
      removeDuplicates = true,
      removeOutliers = false,
      fillNull,
      convertTypes = true,
      trimStrings = true,
    } = options;

    let result = [...data];

    // 移除重复项
    if (removeDuplicates) {
      result = this.removeDuplicates(result);
    }

    // 移除空值
    if (removeNull) {
      result = result.filter((item) => this.isNotNull(item));
    }

    // 填充空值
    if (fillNull !== undefined) {
      result = result.map((item) => this.fillNullValues(item, fillNull));
    }

    // 修剪字符串
    if (trimStrings) {
      result = result.map((item) => this.trimAllStrings(item));
    }

    // 转换类型
    if (convertTypes) {
      result = result.map((item) => this.convertDataTypes(item));
    }

    // 移除异常值
    if (removeOutliers) {
      result = this.removeOutliers(result);
    }

    return result;
  }

  /**
   * 移除重复项
   */
  static removeDuplicates(data: any[]): any[] {
    const seen = new Set<string>();
    return data.filter((item) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 检查是否为空
   */
  static isNotNull(item: any): boolean {
    if (item === null || item === undefined) return false;
    if (typeof item === 'string' && item.trim() === '') return false;
    return true;
  }

  /**
   * 填充空值
   */
  static fillNullValues(item: any, fillValue: any): any {
    const result = { ...item };
    for (const key of Object.keys(result)) {
      if (result[key] === null || result[key] === undefined || result[key] === '') {
        result[key] = fillValue;
      }
    }
    return result;
  }

  /**
   * 修剪所有字符串
   */
  static trimAllStrings(item: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        result[key] = value.trim();
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * 转换数据类型
   */
  static convertDataTypes(item: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        // 尝试转换为数字
        const num = Number(value);
        if (!isNaN(num) && value.trim() !== '') {
          result[key] = num;
          continue;
        }
        // 尝试转换为布尔值
        if (value.toLowerCase() === 'true') {
          result[key] = true;
          continue;
        }
        if (value.toLowerCase() === 'false') {
          result[key] = false;
          continue;
        }
      }
      result[key] = value;
    }
    return result;
  }

  /**
   * 移除异常值 (使用 IQR 方法)
   */
  static removeOutliers(data: any[]): any[] {
    if (data.length < 4) return data;

    const numericFields = this.getNumericFields(data);
    if (numericFields.length === 0) return data;

    const result = [...data];
    const field = numericFields[0];
    const values = result.map((item) => item[field]).filter((v) => typeof v === 'number');

    if (values.length < 4) return data;

    const q1 = this.percentile(values, 25);
    const q3 = this.percentile(values, 75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    return result.filter((item) => {
      const val = item[field];
      return typeof val !== 'number' || (val >= lower && val <= upper);
    });
  }

  /**
   * 获取数值型字段
   */
  static getNumericFields(data: any[]): string[] {
    if (!data || data.length === 0) return [];
    const fields = Object.keys(data[0]);
    return fields.filter((field) => {
      const value = data[0][field];
      return typeof value === 'number';
    });
  }

  /**
   * 数据分组
   */
  static groupBy(data: any[], field: string): Map<any, any[]> {
    const groups = new Map<any, any[]>();

    for (const item of data) {
      const key = item[field];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    return groups;
  }

  /**
   * 数据聚合
   */
  static aggregate(data: any[], options: AggregateOptions): any[] {
    const { groupBy, field, method } = options;
    const groups = this.groupBy(data, groupBy);
    const result: any[] = [];

    for (const [key, items] of groups) {
      const values = items.map((item) => item[field]).filter((v) => typeof v === 'number');
      let value: number;

      switch (method) {
        case 'sum':
          value = values.reduce((sum, v) => sum + v, 0);
          break;
        case 'avg':
          value = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'max':
          value = Math.max(...values);
          break;
        case 'count':
          value = items.length;
          break;
        case 'median':
          value = this.percentile(values, 50);
          break;
        default:
          value = 0;
      }

      result.push({ [groupBy]: key, [method]: value });
    }

    return result;
  }

  /**
   * 数据排序
   */
  static sort(data: any[], field: string, order: 'asc' | 'desc' = 'asc'): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * 数据筛选
   */
  static filter(data: any[], predicate: (item: any) => boolean): any[] {
    return data.filter(predicate);
  }

  /**
   * 数据分页
   */
  static paginate(data: any[], page: number, pageSize: number): any[] {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }

  /**
   * 计算分位数
   */
  static percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  /**
   * 计算统计指标
   */
  static calculateStats(values: number[]): {
    count: number;
    sum: number;
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    range: number;
  } {
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        mean: 0,
        median: 0,
        std: 0,
        min: 0,
        max: 0,
        range: 0,
      };
    }

    const count = values.length;
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / count;
    const sorted = [...values].sort((a, b) => a - b);
    const median = this.percentile(values, 50);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / count;
    const std = Math.sqrt(variance);

    return { count, sum, mean, median, std, min, max, range: max - min };
  }

  /**
   * 计算相关性
   */
  static correlation(data: any[], field1: string, field2: string): CorrelationResult {
    const values1 = data.map((item) => item[field1]).filter((v) => typeof v === 'number') as number[];
    const values2 = data.map((item) => item[field2]).filter((v) => typeof v === 'number') as number[];

    const minLen = Math.min(values1.length, values2.length);
    const v1 = values1.slice(0, minLen);
    const v2 = values2.slice(0, minLen);

    const mean1 = v1.reduce((s, v) => s + v, 0) / minLen;
    const mean2 = v2.reduce((s, v) => s + v, 0) / minLen;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < minLen; i++) {
      const diff1 = v1[i] - mean1;
      const diff2 = v2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    const coefficient = numerator / Math.sqrt(denom1 * denom2);

    let strength: CorrelationResult['strength'];
    const absCoef = Math.abs(coefficient);
    if (absCoef >= 0.7) strength = 'strong';
    else if (absCoef >= 0.4) strength = 'moderate';
    else if (absCoef >= 0.2) strength = 'weak';
    else strength = 'none';

    return {
      field1,
      field2,
      coefficient: isNaN(coefficient) ? 0 : coefficient,
      strength,
      direction: coefficient >= 0 ? 'positive' : 'negative',
    };
  }

  /**
   * 数据转换 - 宽表转长表
   */
  static pivotToLong(data: any[], idVar: string, varName: string, valueName: string): any[] {
    const result: any[] = [];

    for (const item of data) {
      const id = item[idVar];
      for (const [key, value] of Object.entries(item)) {
        if (key !== idVar) {
          result.push({
            [idVar]: id,
            [varName]: key,
            [valueName]: value,
          });
        }
      }
    }

    return result;
  }

  /**
   * 数据转换 - 长表转宽表
   */
  static longToPivot(
    data: any[],
    idVar: string,
    varName: string,
    valueName: string
  ): any[] {
    const groups = this.groupBy(data, idVar);
    const result: any[] = [];

    for (const [id, items] of groups) {
      const row: any = { [idVar]: id };
      for (const item of items) {
        row[item[varName]] = item[valueName];
      }
      result.push(row);
    }

    return result;
  }

  /**
   * 数据归一化
   */
  static normalize(data: any[], field: string, method: 'min-max' | 'z-score' = 'min-max'): any[] {
    const values = data.map((item) => item[field]).filter((v) => typeof v === 'number') as number[];
    const { min, max } = this.calculateStats(values);

    return data.map((item) => {
      const result = { ...item };
      if (typeof item[field] === 'number') {
        if (method === 'min-max') {
          result[field] = (item[field] - min) / (max - min);
        } else {
          const { mean, std } = this.calculateStats(values);
          result[field] = std === 0 ? 0 : (item[field] - mean) / std;
        }
      }
      return result;
    });
  }

  /**
   * 字段分析
   */
  static analyzeField(data: any[], field: string): FieldInfo {
    const values = data.map((item) => item[field]);
    const nonNull = values.filter((v) => v !== null && v !== undefined);

    const info: FieldInfo = {
      name: field,
      type: this.inferType(nonNull),
      nullable: values.length !== nonNull.length,
      unique: new Set(nonNull).size === nonNull.length,
    };

    const numericValues = nonNull.filter((v) => typeof v === 'number') as number[];
    if (numericValues.length > 0) {
      const stats = this.calculateStats(numericValues);
      info.min = stats.min;
      info.max = stats.max;
      info.mean = stats.mean;
    }

    return info;
  }

  /**
   * 推断数据类型
   */
  static inferType(values: any[]): DataType {
    if (values.length === 0) return 'string';

    const sample = values[0];
    if (typeof sample === 'number') return 'number';
    if (typeof sample === 'boolean') return 'boolean';
    if (typeof sample === 'object') {
      if (sample instanceof Date) return 'date';
      return 'object';
    }
    return 'string';
  }

  /**
   * 合并数据集
   */
  static merge(
    left: any[],
    right: any[],
    on: string,
    how: 'inner' | 'left' | 'right' | 'outer' = 'inner'
  ): any[] {
    const rightMap = new Map<any, any[]>();
    for (const item of right) {
      const key = item[on];
      if (!rightMap.has(key)) {
        rightMap.set(key, []);
      }
      rightMap.get(key)!.push(item);
    }

    const result: any[] = [];
    const leftKeys = new Set<any>();

    for (const leftItem of left) {
      const key = leftItem[on];
      leftKeys.add(key);
      const rightItems = rightMap.get(key);

      if (rightItems) {
        for (const rightItem of rightItems) {
          result.push({ ...leftItem, ...rightItem });
        }
      } else if (how === 'left' || how === 'outer') {
        result.push({ ...leftItem });
      }
    }

    if (how === 'right' || how === 'outer') {
      for (const [key, rightItems] of rightMap) {
        if (!leftKeys.has(key)) {
          for (const rightItem of rightItems) {
            result.push({ ...rightItem });
          }
        }
      }
    }

    return result;
  }
}

export default DataProcessor;
