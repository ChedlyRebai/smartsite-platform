// Resource Optimization API URL
const API_BASE_URL = (import.meta as any).env?.VITE_RESOURCE_OPTIMIZATION_URL || 'http://localhost:3007/api';

// Other microservice URLs
const GESTION_SITE_URL = (import.meta as any).env?.VITE_GESTION_SITE_URL || 'http://localhost:3001/api';
const AUTH_API_URL = (import.meta as any).env?.VITE_AUTH_API_URL || 'http://localhost:3000';
const API_GATEWAY_URL = (import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:3000';
const PLANNING_URL = `${API_GATEWAY_URL}/planning`;

// ============ UTILITY FUNCTIONS ============

/**
 * Normalize site ID - handles both _id and id fields
 */
export const getSiteId = (site: any): string => {
  return site?._id || site?.id || '';
};

export const getProjectId = (project: any): string => {
  return project?._id || project?.id || '';
};

// ============ EXTERNAL API TYPES ============

// Types from gestion-projects (port 3007)
export interface Project {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'en_cours' | 'terminé' | 'en_retard';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  actualCost?: number;
  progress: number;
  startDate?: Date;
  endDate?: Date;
  deadline?: string;
  siteCount?: number;
  teamSize?: number;
  clientName?: string;
  projectManagerName?: string;
}

// Types from gestion-site (port 3001)
export interface Site {
  _id?: string;
  id?: string; // Some APIs return id instead of _id
  nom: string;
  localisation: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'suspended';
  budget: number;
  dateDebut: Date;
  dateFin?: Date;
  isActif: boolean;
  teamIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Types from user-authentication (port 3000)
export interface User {
  _id: string;
  name: string;
  email: string;
  cin?: string;
  role: string;
  phone?: string;
  photo?: string;
  siteIds?: string[];
  isActif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Types from gestion-planing (port 3002)
export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  milestoneId?: string;
  siteId?: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  siteId: string;
  startDate: Date;
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Types from incident-management
export type IncidentType = 'safety' | 'quality' | 'delay' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Incident {
  _id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description?: string;
  status: IncidentStatus;
  siteId?: string;
  projectId?: string;
  reporterName?: string;
  assignedToCin?: string;
  assignedUserRole?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============ INTERNAL TYPES ============

// Resource Analysis Interfaces
export interface IdleEquipment {
  id: string;
  name: string;
  utilizationRate: number;
  hoursOperating: number;
  type: string;
  wastePercentage: number;
}

export interface PeakConsumptionPeriod {
  date: string;
  electricity: number;
  fuel: number;
  water: number;
  waste: number;
  co2: number;
}

export interface WorkerProductivity {
  id: string;
  name: string;
  role: string;
  hoursWorked: number;
  costIncurred: number;
  productivityScore: number;
  efficiency: 'high' | 'medium' | 'low';
}

export interface CostBreakdown {
  equipment: number;
  workers: number;
  total: number;
  breakdown: {
    equipmentPercentage: number;
    workersPercentage: number;
  };
}

export interface EnvironmentalImpact {
  totalCO2: number;
  totalWaste: number;
}

export interface ResourceAnalysis {
  idleEquipment: IdleEquipment[];
  peakConsumptionPeriods: PeakConsumptionPeriod[];
  workerProductivity: WorkerProductivity[];
  costBreakdown: CostBreakdown;
  environmentalImpact: EnvironmentalImpact;
  recommendations: string[];
}

// Recommendation Interfaces
export type RecommendationType =
  | 'energy' | 'workforce' | 'equipment' | 'scheduling' | 'environmental'
  | 'budget' | 'timeline' | 'task_distribution' | 'resource_allocation' | 'individual_task_management';
export type RecommendationStatus = 'pending' | 'approved' | 'rejected' | 'implemented';

export interface Recommendation {
  _id: string;
  siteId?: string;
  projectId?: string;
  scope?: 'project' | 'site';
  type: RecommendationType;
  title: string;
  description: string;
  status: RecommendationStatus;
  priority: number;
  estimatedSavings: number;
  estimatedCO2Reduction: number;
  confidenceScore: number;
  actionItems: string[];
  targetMember?: string;
  currentTasks?: string[];
  suggestedDuration?: number;
  createdAt: Date;
  approvedAt?: Date;
  implementedAt?: Date;
}

export interface RecommendationsSummary {
  totalPotentialSavings: string;
  approvedSavings: string;
  realizedSavings: string;
  totalCO2Reduction: string;
}

// ============ POWER BI TYPES ============

export interface PowerBiRealTimeMetrics {
  activeRecommendations: number;
  pendingApprovals: number;
  activeAlerts: number;
  criticalAlerts: number;
  liveSavings: number;
  liveCO2Reduction: number;
}

export interface PowerBiTrends {
  recommendationsByDay: Array<{ date: string; count: number; savings: number }>;
  alertsByHour: Array<{ hour: string; count: number; severity: string }>;
  performanceByWeek: Array<{ week: string; savings: number; co2: number }>;
}

export interface PowerBiKPIs {
  roi: number;
  efficiencyScore: number;
  sustainabilityIndex: number;
  budgetVariance: number;
}

export interface PowerBiRecommendationsAnalysis {
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  topPerforming: Array<{ type: string; savings: number; impact: number }>;
}

export interface PowerBiAlertsAnalysis {
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  responseTimes: Array<{ alertType: string; avgResponseTime: number }>;
}

export interface PowerBiPredictiveInsights {
  nextWeekSavings: number;
  riskAlerts: Array<{ type: string; probability: number; impact: string }>;
  optimizationOpportunities: Array<{ area: string; potentialSavings: number }>;
}

export interface PowerBiDashboardData {
  realTimeMetrics: PowerBiRealTimeMetrics;
  trends: PowerBiTrends;
  kpis: PowerBiKPIs;
  recommendationsAnalysis: PowerBiRecommendationsAnalysis;
  alertsAnalysis: PowerBiAlertsAnalysis;
  predictiveInsights: PowerBiPredictiveInsights;
  lastUpdated: string;
}

// Alert Interfaces
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'equipment' | 'energy' | 'workforce' | 'scheduling' | 'environmental' | 'safety' | 'budget';

export interface Alert {
  _id: string;
  siteId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  isRead: boolean;
  status: 'active' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface AlertSummary {
  total: number;
  unread: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<AlertType, number>;
}

// Reporting Interfaces
export interface DashboardData {
  performance: {
    totalSavings: number;
    co2Reduction: number;
    implementedRecommendations: number;
  };
  financial: {
    currentResourcesCosts: number;
    realizedSavings: string;
    roi: string;
  };
  environmental: {
    currentCO2Emissions: string;
    actualCO2Reduction: string;
    potentialCO2Reduction: string;
    reductionPercentage: string;
    totalCO2Emissions: string;
  };
  recommendations: {
    total: number;
    pending: number;
    approved: number;
    implemented: number;
  };
}
