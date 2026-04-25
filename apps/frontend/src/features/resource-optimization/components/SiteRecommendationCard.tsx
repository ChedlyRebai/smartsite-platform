import React, { useState, useEffect } from 'react';
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
  Building2,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Zap,
  DollarSign,
  BarChart3,
  UserCheck,
  Eye,
  ArrowRight,
} from 'lucide-react';

const RESOURCE_OPT_API =
  (import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL &&
    String(import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL).replace(/\/$/, '')) ||
  '/api';

interface SiteRecommendationCardProps {
  site: any;
  siteId: string;
  onSelect: () => void;
}

interface Recommendation {
  _id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  estimatedSavings: number;
  priority: number;
  confidenceScore: number;
  targetMember?: string;
  currentTasks?: string[];
  suggestedDuration?: number;
}

export const SiteRecommendationCard: React.FC<SiteRecommendationCardProps> = ({
  site,
  siteId,
  onSelect,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch recommendations for this site
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const qs = new URLSearchParams({ siteId });
        const response = await fetch(
          `${RESOURCE_OPT_API}/recommendations?${qs.toString()}`,
        );
        if (response.ok) {
          const data = await response.json();
          setRecommendations(Array.isArray(data) ? data : []);
        } else {
          // Graceful fallback: don't show error for 500, just empty state
          console.warn(`Recommendations API returned ${response.status} for site ${siteId}`);
          setRecommendations([]);
        }
      } catch (err) {
        // Service likely down - fail silently
        console.warn('Recommendations service unavailable:', err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [siteId]);

  // Generate recommendations if none exist
  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${RESOURCE_OPT_API}/recommendations/generate/${siteId}`,
        { method: 'POST' },
      );
      if (response.ok) {
        const qs = new URLSearchParams({ siteId });
        const recommendationsResponse = await fetch(
          `${RESOURCE_OPT_API}/recommendations?${qs.toString()}`,
        );
        if (recommendationsResponse.ok) {
          const data = await recommendationsResponse.json();
          setRecommendations(Array.isArray(data) ? data : []);
        }
      } else {
        setError('Failed to generate recommendations');
      }
    } catch (err) {
      setError('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Calculate site statistics
  const siteStats = {
    totalRecommendations: recommendations.length,
    urgentRecommendations: recommendations.filter(r => r.priority >= 8).length,
    implementedRecommendations: recommendations.filter(r => r.status === 'implemented').length,
    potentialSavings: recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0),
    individualRecommendations: recommendations.filter(r => r.type === 'individual_task_management').length,
  };

  const typeIcons = {
    energy: <Zap className="h-4 w-4" />,
    equipment: <Building2 className="h-4 w-4" />,
    workforce: <Users className="h-4 w-4" />,
    scheduling: <Calendar className="h-4 w-4" />,
    environmental: <AlertTriangle className="h-4 w-4" />,
    budget: <DollarSign className="h-4 w-4" />,
    task_distribution: <BarChart3 className="h-4 w-4" />,
    timeline: <TrendingUp className="h-4 w-4" />,
    resource_allocation: <Users className="h-4 w-4" />,
    individual_task_management: <UserCheck className="h-4 w-4" />,
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
    rejected: { color: 'bg-gray-100 text-gray-800', label: 'Rejected' },
    implemented: { color: 'bg-green-100 text-green-800', label: 'Implemented' },
  };

  return (
    <Card className="border border-slate-200 bg-white hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{site.nom}</CardTitle>
              <Badge className={
                site.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  site.status === 'planning' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
              }>
                {site.status}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {site.localisation} • Budget: {(site.budget || 0).toLocaleString()} TND
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" />
              {showDetails ? 'Hide details' : 'View details'}
            </Button>
            <Button
              size="sm"
              onClick={onSelect}
              className="gap-1.5 bg-slate-900 hover:bg-slate-800"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Site Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center rounded-lg border border-slate-200 bg-slate-50 py-2 px-1">
            <div className="text-lg font-semibold text-slate-900">{siteStats.totalRecommendations}</div>
            <div className="text-xs text-slate-600">Recommendations</div>
          </div>
          <div className="text-center rounded-lg border border-slate-200 bg-slate-50 py-2 px-1">
            <div className="text-lg font-semibold text-rose-700">{siteStats.urgentRecommendations}</div>
            <div className="text-xs text-slate-600">Urgent</div>
          </div>
          <div className="text-center rounded-lg border border-slate-200 bg-slate-50 py-2 px-1">
            <div className="text-lg font-semibold text-emerald-700">{siteStats.implementedRecommendations}</div>
            <div className="text-xs text-slate-600">Implemented</div>
          </div>
          <div className="text-center rounded-lg border border-slate-200 bg-slate-50 py-2 px-1">
            <div className="text-lg font-semibold text-indigo-700">{siteStats.individualRecommendations}</div>
            <div className="text-xs text-slate-600">Individual</div>
          </div>
        </div>

        {/* Progress Bar */}
        {siteStats.totalRecommendations > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <small className="text-gray-600">Progress</small>
              <small className="font-semibold">
                {Math.round((siteStats.implementedRecommendations / siteStats.totalRecommendations) * 100)}%
              </small>
            </div>
            <Progress
              value={(siteStats.implementedRecommendations / siteStats.totalRecommendations) * 100}
              className="h-2"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {recommendations.length === 0 && !loading && (
            <Button
              onClick={generateRecommendations}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Generating...' : 'Generate AI recommendations'}
            </Button>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Detailed Recommendations */}
        {showDetails && recommendations.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-sm">Recent recommendations</h4>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec._id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-start gap-2">
                    {typeIcons[rec.type] || <AlertTriangle className="h-4 w-4" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{rec.title}</span>
                        <Badge className={`${statusConfig[rec.status]?.color || statusConfig.pending.color} border`}>
                          {statusConfig[rec.status]?.label || statusConfig.pending.label}
                        </Badge>
                      </div>
                      {rec.targetMember && (
                        <div className="text-xs text-blue-600 mt-1">
                          Member: {rec.targetMember}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rec.description}</p>
                      {rec.estimatedSavings && (
                        <div className="text-xs text-green-600 mt-1">
                          Savings: {rec.estimatedSavings} TND
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.length > 3 && (
                <div className="text-center text-sm text-gray-500">
                  ...and {recommendations.length - 3} more recommendations
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
