import {
  FlowType,
  AnomalyType,
  AnomalySeverity,
} from '../entities/consumption-history.entity';

export interface SyncReport {
  synced: number;
  skipped: number;
  errors: number;
  details?: string[];
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  appliedFilters: Record<string, any>;
}

export interface TimelineDataPoint {
  period: string;
  totalConsumed: number;
  totalReceived: number;
  totalDamaged: number;
  netFlow: number;
  anomalyCount: number;
  avgAnomalyScore: number;
}

export interface FlowTypeBreakdown {
  type: FlowType;
  count: number;
  totalQuantity: number;
  percentage: number;
}

export interface AnomalyBreakdown {
  type: AnomalyType;
  count: number;
  percentage: number;
  severity: AnomalySeverity;
}

export interface TopMaterial {
  materialId: string;
  materialName: string;
  totalConsumed: number;
  anomalyCount: number;
  avgAnomalyScore: number;
}

export interface StatisticsSummary {
  totalEntries: number;
  totalConsumed: number;
  totalReceived: number;
  totalDamaged: number;
  anomalyRate: number;
  criticalAnomalies: number;
  avgDailyConsumption: number;
  periodDays: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  interpretation: string;
}

export interface ConsumptionStatistics {
  timeline: TimelineDataPoint[];
  flowTypeBreakdown: FlowTypeBreakdown[];
  anomalyBreakdown: AnomalyBreakdown[];
  topMaterials: TopMaterial[];
  summary: StatisticsSummary;
  trend: TrendAnalysis;
}

export interface MaterialTrendDataPoint {
  date: string;
  consumed: number;
  received: number;
  stockLevel: number;
}

export interface MaterialTrend {
  materialId: string;
  materialName: string;
  days: number;
  data: MaterialTrendDataPoint[];
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number;
  };
}
