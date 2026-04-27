import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useRecommendations,
  useGenerateRecommendations,
  useRecommendationsSummary,
  useUpdateRecommendationStatus,
  useIncidentsBySite,
} from '../../hooks/useResourceApi';
import { RecommendationsList } from '../../components/RecommendationsList';
import {
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Star,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type { Incident } from '../../types';
import type { RecommendationStatus } from '../../types';

interface RecommendationsPageProps {
  siteId: string;
}

// ─── Incident severity badge ───────────────────────────────────────────────
const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-red-100 text-red-800 border-red-200',    label: '🔴 Critique' },
  high:     { color: 'bg-orange-100 text-orange-800 border-orange-200', label: '🟠 Élevé' },
  medium:   { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: '🟡 Moyen' },
  low:      { color: 'bg-green-100 text-green-800 border-green-200',  label: '🟢 Faible' },
};

const incidentTypeIcon: Record<string, React.ReactNode> = {
  safety:  <ShieldAlert className="h-4 w-4 text-red-500" />,
  quality: <Star className="h-4 w-4 text-yellow-500" />,
  delay:   <Clock className="h-4 w-4 text-orange-500" />,
  other:   <AlertTriangle className="h-4 w-4 text-gray-500" />,
};

const IncidentCard: React.FC<{ incident: Incident }> = ({ incident }) => {
  const sev = severityConfig[incident.severity] || severityConfig.low;
  const isOpen = incident.status === 'open' || incident.status === 'investigating';

  return (
    <Card className={`border ${isOpen ? 'border-orange-200' : 'border-gray-200'}`}>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {incidentTypeIcon[incident.type]}
            <span className="font-semibold text-sm">{incident.title}</span>
          </div>
          <Badge className={sev.color}>{sev.label}</Badge>
        </div>
        {incident.description && (
          <p className="text-xs text-gray-500">{incident.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="capitalize">Type: {incident.type}</span>
          <span>•</span>
          <span className={isOpen ? 'text-orange-600 font-medium' : 'text-green-600'}>
            {incident.status === 'open' ? 'Ouvert'
              : incident.status === 'investigating' ? 'En investigation'
              : incident.status === 'resolved' ? 'Résolu'
              : 'Fermé'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────
export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ siteId }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: recommendations, isLoading, refetch } = useRecommendations(siteId);
  const { data: summary } = useRecommendationsSummary(siteId);
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidentsBySite(siteId);
  const generateRecs = useGenerateRecommendations(siteId);
  const updateStatus = useUpdateRecommendationStatus();

  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high');

  // Incident-driven recommendations (budget + timeline types)
  const incidentRecs = (recommendations || []).filter(r =>
    r.type === 'budget' || r.type === 'timeline' || r.type === 'resource_allocation'
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateRecs.mutateAsync();
      refetch();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = (id: string) => updateStatus.mutate({ id, status: 'approved' });
  const handleReject  = (id: string) => updateStatus.mutate({ id, status: 'rejected' });
  const handleImplement = (id: string) => updateStatus.mutate({ id, status: 'implemented' });
  const handleMoveStatus = (id: string, status: RecommendationStatus) => updateStatus.mutate({ id, status });

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/resource-optimization/${siteId}`)}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💡 Recommandations</h1>
          <p className="text-gray-600 mt-1">
            Suggestions intelligentes basées sur les données du site, projets et incidents
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Génération...' : 'Générer'}
        </Button>
      </div>

      {/* Incident alert banner */}
      {openIncidents.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-orange-800">
              {openIncidents.length} incident(s) ouvert(s) détecté(s)
            </p>
            <p className="text-sm text-orange-600 mt-1">
              {criticalIncidents.length} critique(s) / élevé(s) — des recommandations ont été générées
              pour réduire leur impact sur le budget et les délais.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-xs text-gray-500">Économies potentielles</p>
                <p className="text-xl font-bold">{summary.totalPotentialSavings} TND</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Approuvées</p>
                <p className="text-xl font-bold">{summary.approvedSavings} TND</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <Star className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Réalisées</p>
                <p className="text-xl font-bold">{summary.realizedSavings} TND</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Incidents ouverts</p>
                <p className="text-xl font-bold">{openIncidents.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all"        onClick={() => setFilter(undefined)}>Toutes</TabsTrigger>
          <TabsTrigger value="budget"     onClick={() => setFilter('budget')}>Budget</TabsTrigger>
          <TabsTrigger value="timeline"   onClick={() => setFilter('timeline')}>Délais</TabsTrigger>
          <TabsTrigger value="task_distribution" onClick={() => setFilter('task_distribution')}>Tâches</TabsTrigger>
          <TabsTrigger value="resource_allocation" onClick={() => setFilter('resource_allocation')}>Ressources</TabsTrigger>
          <TabsTrigger value="energy"     onClick={() => setFilter('energy')}>Énergie</TabsTrigger>
          <TabsTrigger value="incidents"  onClick={() => setFilter(undefined)}>
            Incidents
            {openIncidents.length > 0 && (
              <Badge className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0">
                {openIncidents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All recommendations */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les recommandations ({recommendations?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations || []}
                loading={isLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                onMoveStatus={handleMoveStatus}
                filter={filter}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget tab */}
        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Recommandations budget</CardTitle>
            </CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations || []}
                loading={isLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                onMoveStatus={handleMoveStatus}
                filter="budget"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Recommandations délais</CardTitle>
            </CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations || []}
                loading={isLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                onMoveStatus={handleMoveStatus}
                filter="timeline"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task distribution tab */}
        <TabsContent value="task_distribution">
          <Card>
            <CardHeader><CardTitle>Répartition des tâches</CardTitle></CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations || []}
                loading={isLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                onMoveStatus={handleMoveStatus}
                filter="task_distribution"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource allocation tab */}
        <TabsContent value="resource_allocation">
          <Card>
            <CardHeader><CardTitle>Allocation des ressources</CardTitle></CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations || []}
                loading={isLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                onMoveStatus={handleMoveStatus}
                filter="resource_allocation"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Energy tab */}
        <TabsContent value="energy">
          <Card>
            <CardHeader><CardTitle>Énergie</CardTitle></CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations || []}
                loading={isLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                onMoveStatus={handleMoveStatus}
                filter="energy"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents tab */}
        <TabsContent value="incidents">
          <div className="space-y-6">
            {/* Incident-driven recommendations */}
            {incidentRecs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Recommandations générées par les incidents ({incidentRecs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecommendationsList
                    recommendations={incidentRecs}
                    loading={isLoading}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onImplement={handleImplement}
                    onMoveStatus={handleMoveStatus}
                  />
                </CardContent>
              </Card>
            )}

            {/* Incidents list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Incidents du site ({incidents.length})
                  {openIncidents.length > 0 && (
                    <Badge className="bg-orange-100 text-orange-800">
                      {openIncidents.length} ouverts
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incidentsLoading ? (
                  <p className="text-center text-gray-500 py-4">Chargement des incidents...</p>
                ) : incidents.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Aucun incident pour ce site</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {incidents.map(incident => (
                      <IncidentCard key={incident._id} incident={incident} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecommendationsPage;
