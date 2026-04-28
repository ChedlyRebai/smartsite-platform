import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Briefcase,
  Users,
  Calendar,
  Leaf,
  TrendingDown,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3,
  TrendingUp,
  UserCheck,
  GripVertical,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

interface RecommendationCardProps {
  rec: {
    _id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    estimatedSavings: number;
    estimatedCO2Reduction: number;
    priority: number;
    confidenceScore: number;
    actionItems?: string[];
    targetMember?: string;
    currentTasks?: string[];
    suggestedDuration?: number;
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onImplement: (id: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  rec,
  onApprove,
  onReject,
  onImplement,
}) => {
  const typeIcons: Record<string, React.ReactNode> = {
    energy: <Zap className="h-5 w-5" />,
    equipment: <Briefcase className="h-5 w-5" />,
    workforce: <Users className="h-5 w-5" />,
    scheduling: <Calendar className="h-5 w-5" />,
    environmental: <Leaf className="h-5 w-5" />,
    budget: <DollarSign className="h-5 w-5" />,
    task_distribution: <BarChart3 className="h-5 w-5" />,
    timeline: <TrendingUp className="h-5 w-5" />,
    resource_allocation: <Users className="h-5 w-5" />,
    individual_task_management: <UserCheck className="h-5 w-5" />,
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: '⏳ En attente' },
    approved: { color: 'bg-blue-100 text-blue-800', label: '✅ Approuvée' },
    rejected: { color: 'bg-gray-100 text-gray-800', label: '❌ Rejetée' },
    implemented: { color: 'bg-green-100 text-green-800', label: '🎉 Mise en place' },
  };

  const status = statusConfig[rec.status] || statusConfig.pending;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {typeIcons[rec.type]}
            <div className="flex-1">
              <CardTitle className="text-lg">{rec.title}</CardTitle>
              <CardDescription className="mt-1">{rec.description}</CardDescription>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Member Information for Individual Recommendations */}
        {rec.type === 'individual_task_management' && rec.targetMember && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2">
              <UserCheck className="h-4 w-4" />
              Recommandation pour: {rec.targetMember}
            </div>
            {rec.currentTasks && rec.currentTasks.length > 0 && (
              <div className="text-sm text-blue-600">
                <strong>Tâches actuelles:</strong>
                <ul className="list-disc list-inside mt-1">
                  {rec.currentTasks.slice(0, 3).map((task: string, index: number) => (
                    <li key={index}>{task}</li>
                  ))}
                  {rec.currentTasks.length > 3 && (
                    <li className="text-blue-500">...et {rec.currentTasks.length - 3} autres</li>
                  )}
                </ul>
              </div>
            )}
            {rec.suggestedDuration && (
              <div className="text-sm text-blue-600 mt-2">
                <strong>Durée suggérée:</strong> {rec.suggestedDuration} jours maximum par tâche
              </div>
            )}
          </div>
        )}

        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <small className="text-gray-600">Confiance</small>
            <small className="font-semibold">{rec.confidenceScore}%</small>
          </div>
          <Progress value={rec.confidenceScore} className="h-2" />
        </div>

        {/* Savings & Impact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <TrendingDown className="h-4 w-4" />
              Économies potentielles
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {rec.estimatedSavings ? `${rec.estimatedSavings.toFixed(0)} TND` : 'N/A'}
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <Leaf className="h-4 w-4" />
              Réduction CO₂
            </div>
            <div className="text-xl font-bold text-green-900 mt-1">
              {rec.estimatedCO2Reduction ? `${rec.estimatedCO2Reduction.toFixed(0)} kg` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Priority */}
        <div>
          <div className="text-sm font-semibold mb-2">Priorité: {rec.priority}/10</div>
          <Progress value={rec.priority * 10} className="h-2" />
        </div>

        {/* Action Items */}
        {rec.actionItems && rec.actionItems.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Actions recommandées :</p>
            <ul className="space-y-1">
              {rec.actionItems.slice(0, 3).map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
              {rec.actionItems.length > 3 && (
                <li className="text-xs text-gray-400">+{rec.actionItems.length - 3} autres actions</li>
              )}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        {rec.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(rec._id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approuver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onReject(rec._id)}
            >
              Rejeter
            </Button>
          </div>
        )}

        {rec.status === 'approved' && (
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onImplement(rec._id)}
          >
            <Clock className="h-4 w-4 mr-1" />
            Mettre en place
          </Button>
        )}

        {rec.status === 'implemented' && (
          <div className="text-center py-2 bg-green-50 rounded text-green-700 text-sm font-semibold">
            ✓ Mise en place effectuée
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RecommendationsListProps {
  recommendations: RecommendationCardProps['rec'][];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onImplement: (id: string) => void;
  onMoveStatus?: (id: string, status: RecommendationStatus) => void;
  loading?: boolean;
  filter?: string;
}

type RecommendationStatus = 'pending' | 'approved' | 'implemented' | 'rejected';

const BOARD_COLUMNS: Array<{
  status: RecommendationStatus;
  title: string;
  hint: string;
  color: string;
}> = [
  {
    status: 'pending',
    title: 'Pending',
    hint: 'Drag to Approved or Rejected',
    color: 'border-amber-200 bg-amber-50/40',
  },
  {
    status: 'approved',
    title: 'Approved',
    hint: 'Drag to Implemented',
    color: 'border-blue-200 bg-blue-50/40',
  },
  {
    status: 'implemented',
    title: 'Implemented',
    hint: 'Completed workflow',
    color: 'border-emerald-200 bg-emerald-50/40',
  },
  {
    status: 'rejected',
    title: 'Rejected',
    hint: 'Declined recommendations',
    color: 'border-slate-200 bg-slate-50/40',
  },
];

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
  onApprove,
  onReject,
  onImplement,
  onMoveStatus,
  loading,
  filter,
}) => {
  const [draggedRecommendationId, setDraggedRecommendationId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<RecommendationStatus | null>(null);
  const [pendingPage, setPendingPage] = useState(1);

  const filtered = filter
    ? recommendations.filter((r) => r.type === filter)
    : recommendations;

  const recommendationsByStatus = useMemo(() => {
    const grouped: Record<RecommendationStatus, RecommendationsListProps['recommendations']> = {
      pending: [],
      approved: [],
      implemented: [],
      rejected: [],
    };

    for (const recommendation of filtered) {
      const status = recommendation.status as RecommendationStatus;
      if (grouped[status]) {
        grouped[status].push(recommendation);
      }
    }

    return grouped;
  }, [filtered]);
  const pendingPageSize = 5;
  const pendingPageCount = Math.max(
    1,
    Math.ceil(recommendationsByStatus.pending.length / pendingPageSize),
  );
  const paginatedPending = recommendationsByStatus.pending.slice(
    (pendingPage - 1) * pendingPageSize,
    pendingPage * pendingPageSize,
  );
  const analyticsData = useMemo(() => {
    const statusSeries = [
      { status: 'Pending', count: recommendationsByStatus.pending.length },
      { status: 'Approved', count: recommendationsByStatus.approved.length },
      { status: 'Implemented', count: recommendationsByStatus.implemented.length },
      { status: 'Rejected', count: recommendationsByStatus.rejected.length },
    ];
    const typeMap = filtered.reduce((acc, recommendation) => {
      acc[recommendation.type] = (acc[recommendation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const typeSeries = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    return { statusSeries, typeSeries };
  }, [filtered, recommendationsByStatus]);

  useEffect(() => {
    setPendingPage(1);
  }, [filter, recommendationsByStatus.pending.length]);

  const moveRecommendation = (recommendationId: string, targetStatus: RecommendationStatus) => {
    const recommendation = filtered.find((item) => item._id === recommendationId);
    if (!recommendation) return;
    if ((recommendation.status as RecommendationStatus) === targetStatus) return;

    if (onMoveStatus) {
      onMoveStatus(recommendationId, targetStatus);
      return;
    }

    if (targetStatus === 'approved') {
      onApprove(recommendationId);
      return;
    }

    if (targetStatus === 'rejected') {
      onReject(recommendationId);
      return;
    }

    if (targetStatus === 'implemented') {
      onImplement(recommendationId);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading recommendations...</div>;
  }

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recommendations found for this filter
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
        Drag and drop recommendations between columns to change status quickly.
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {BOARD_COLUMNS.map((column) => (
          <div
            key={column.status}
            className={`rounded-xl border p-3 transition-colors ${column.color} ${
              activeDropZone === column.status ? 'ring-2 ring-indigo-400/60' : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setActiveDropZone(column.status);
            }}
            onDragLeave={() => setActiveDropZone(null)}
            onDrop={(event) => {
              event.preventDefault();
              const recommendationId = event.dataTransfer.getData('text/plain') || draggedRecommendationId;
              if (recommendationId) {
                moveRecommendation(recommendationId, column.status);
              }
              setDraggedRecommendationId(null);
              setActiveDropZone(null);
            }}
          >
            <div className="mb-3 border-b border-border/60 pb-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{column.title}</h4>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {recommendationsByStatus[column.status].length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{column.hint}</p>
            </div>
            <div className="space-y-3">
              {(column.status === 'pending' ? paginatedPending : recommendationsByStatus[column.status]).length === 0 && (
                <div className="rounded-md border border-dashed border-border bg-white/70 px-3 py-4 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
              {(column.status === 'pending' ? paginatedPending : recommendationsByStatus[column.status]).map((rec) => (
                <div
                  key={rec._id}
                  draggable
                  onDragStart={(event) => {
                    setDraggedRecommendationId(rec._id);
                    event.dataTransfer.setData('text/plain', rec._id);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDraggedRecommendationId(null);
                    setActiveDropZone(null);
                  }}
                  className="group"
                >
                  <div className="mb-1 flex items-center justify-between px-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <GripVertical className="h-3.5 w-3.5" />
                      Drag
                    </span>
                    <span>Priority {rec.priority}/10</span>
                  </div>
                  <RecommendationCard
                    rec={rec}
                    onApprove={onApprove}
                    onReject={onReject}
                    onImplement={onImplement}
                  />
                </div>
              ))}
              {column.status === 'pending' && recommendationsByStatus.pending.length > pendingPageSize && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-white p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingPage((current) => Math.max(1, current - 1))}
                    disabled={pendingPage <= 1}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Pending page {pendingPage}/{pendingPageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingPage((current) => Math.min(pendingPageCount, current + 1))}
                    disabled={pendingPage >= pendingPageCount}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Professional Recommendation Dashboard</CardTitle>
          <CardDescription>
            Workflow statistics and distribution charts with legend.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-sm font-semibold">Status distribution</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analyticsData.statusSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Recommendations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-sm font-semibold">Recommendation types</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analyticsData.typeSeries}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {analyticsData.typeSeries.map((entry, index) => (
                    <Cell
                      key={`type-cell-${entry.name}`}
                      fill={['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 6]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const typeIcons: Record<string, React.ReactNode> = {
  energy: <Zap className="h-5 w-5" />,
  equipment: <Briefcase className="h-5 w-5" />,
  workforce: <Users className="h-5 w-5" />,
  scheduling: <Calendar className="h-5 w-5" />,
  environmental: <Leaf className="h-5 w-5" />,
};
