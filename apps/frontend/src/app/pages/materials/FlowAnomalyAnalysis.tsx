import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Package,
  MapPin,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { toast } from 'sonner';
import materialFlowService from '../../../services/materialFlowService';

interface FlowAnomalyAnalysisProps {
  siteId?: string;
  days?: number;
}

interface MaterialAnomaly {
  materialId: string;
  materialName: string;
  materialCode: string;
  totalIn: number;
  totalOut: number;
  netFlow: number;
  anomalyType: string;
  anomalyCount: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskReason: string;
  lastAnomaly: Date | null;
}

interface SiteAnomaly {
  siteId: string;
  siteName: string;
  totalAnomalies: number;
  criticalCount: number;
  warningCount: number;
  materials: MaterialAnomaly[];
}

interface AnalysisData {
  summary: {
    totalMaterials: number;
    materialsWithAnomalies: number;
    criticalAnomalies: number;
    warningAnomalies: number;
    totalExcessiveOut: number;
    totalExcessiveIn: number;
  };
  anomaliesBySite: SiteAnomaly[];
}

export default function FlowAnomalyAnalysis({ siteId, days = 30 }: FlowAnomalyAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState(days);

  useEffect(() => {
    loadAnalysis();
  }, [siteId, daysFilter]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const data = await materialFlowService.analyzeFlowAnomalies(siteId, daysFilter);
      setAnalysis(data);
      
      if (data.summary.criticalAnomalies > 0) {
        toast.error(`${data.summary.criticalAnomalies} anomalies critiques détectées!`, {
          description: 'Risque de vol ou gaspillage identifié',
        });
      }
    } catch (error) {
      console.error('Error loading flow analysis:', error);
      toast.error('Erreur lors du chargement de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const config = {
      CRITICAL: { label: '🚨 CRITIQUE', className: 'bg-red-600 text-white' },
      HIGH: { label: '⚠️ ÉLEVÉ', className: 'bg-orange-500 text-white' },
      MEDIUM: { label: '⚠️ MOYEN', className: 'bg-yellow-500 text-white' },
      LOW: { label: 'ℹ️ FAIBLE', className: 'bg-blue-500 text-white' },
    };
    const cfg = config[level as keyof typeof config] || config.LOW;
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <Shield className="h-6 w-6 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'MEDIUM':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
            <p className="mt-4 text-gray-500">Analyse des flux en cours...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>Aucune donnée d'analyse disponible</p>
            <Button onClick={loadAnalysis} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Charger l'analyse
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="flow-days-filter" className="block text-sm font-medium mb-1">Période d'analyse</label>
                <select
                  id="flow-days-filter"
                  value={daysFilter}
                  onChange={(e) => setDaysFilter(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value={7}>7 derniers jours</option>
                  <option value={14}>14 derniers jours</option>
                  <option value={30}>30 derniers jours</option>
                  <option value={60}>60 derniers jours</option>
                  <option value={90}>90 derniers jours</option>
                </select>
              </div>
            </div>
            <Button onClick={loadAnalysis} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Anomalies Critiques</p>
                <p className="text-3xl font-bold text-red-600">{analysis.summary.criticalAnomalies}</p>
                <p className="text-xs text-gray-500 mt-1">Risque de vol/gaspillage</p>
              </div>
              <Shield className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertes</p>
                <p className="text-3xl font-bold text-orange-600">{analysis.summary.warningAnomalies}</p>
                <p className="text-xs text-gray-500 mt-1">Nécessitent attention</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Matériaux Analysés</p>
                <p className="text-3xl font-bold text-blue-600">{analysis.summary.totalMaterials}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.summary.materialsWithAnomalies} avec anomalies
                </p>
              </div>
              <Package className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flow Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Sorties Excessives</p>
                <p className="text-2xl font-bold text-red-600">{analysis.summary.totalExcessiveOut}</p>
                <p className="text-xs text-gray-500">matériaux concernés</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Entrées Excessives</p>
                <p className="text-2xl font-bold text-green-600">{analysis.summary.totalExcessiveIn}</p>
                <p className="text-xs text-gray-500">matériaux concernés</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies by Site */}
      {analysis.anomaliesBySite.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-green-600">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Aucune anomalie détectée</h3>
              <p className="text-gray-600">Tous les flux de matériaux sont normaux</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        analysis.anomaliesBySite.map((site) => (
          <Card key={site.siteId} className="border-l-4 border-l-red-500">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span>{site.siteName}</span>
                  {site.criticalCount > 0 && (
                    <Badge variant="destructive">
                      {site.criticalCount} critique{site.criticalCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {site.warningCount > 0 && (
                    <Badge className="bg-orange-500 text-white">
                      {site.warningCount} alerte{site.warningCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSite(selectedSite === site.siteId ? null : site.siteId)}
                >
                  {selectedSite === site.siteId ? 'Masquer' : 'Détails'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {site.materials
                  .filter(m => selectedSite === site.siteId || m.riskLevel === 'CRITICAL' || m.riskLevel === 'HIGH')
                  .map((material) => (
                    <div
                      key={material.materialId}
                      className={`p-4 rounded-lg border-2 ${
                        material.riskLevel === 'CRITICAL'
                          ? 'bg-red-50 border-red-300'
                          : material.riskLevel === 'HIGH'
                          ? 'bg-orange-50 border-orange-300'
                          : material.riskLevel === 'MEDIUM'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getRiskIcon(material.riskLevel)}
                          <div>
                            <h4 className="font-bold text-lg">{material.materialName}</h4>
                            <p className="text-sm text-gray-600">Code: {material.materialCode}</p>
                          </div>
                        </div>
                        {getRiskBadge(material.riskLevel)}
                      </div>

                      {/* Risk Message */}
                      <div className="mb-3 p-3 bg-white rounded border-l-4 border-red-500">
                        <p className="text-sm font-medium text-gray-800">{material.riskReason}</p>
                      </div>

                      {/* Flow Statistics */}
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center p-2 bg-white rounded">
                          <ArrowDownCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-600">Entrées</p>
                          <p className="text-lg font-bold text-green-600">{material.totalIn}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <ArrowUpCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-600">Sorties</p>
                          <p className="text-lg font-bold text-red-600">{material.totalOut}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <TrendingDown className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-600">Flux Net</p>
                          <p className={`text-lg font-bold ${material.netFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {material.netFlow}
                          </p>
                        </div>
                      </div>

                      {/* Ratio Analysis */}
                      {material.totalIn > 0 && (
                        <div className="p-3 bg-white rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Ratio Sortie/Entrée:</span>
                            <span className={`text-lg font-bold ${
                              (material.totalOut / material.totalIn) > 1.5 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {((material.totalOut / material.totalIn) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (material.totalOut / material.totalIn) > 1.5 ? 'bg-red-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min((material.totalOut / material.totalIn) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Anomaly Details */}
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">
                            {material.anomalyCount} anomalie{material.anomalyCount > 1 ? 's' : ''} détectée{material.anomalyCount > 1 ? 's' : ''}
                          </span>
                        </div>
                        {material.lastAnomaly && (
                          <span className="text-xs text-gray-500">
                            Dernière: {new Date(material.lastAnomaly).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {selectedSite !== site.siteId && site.materials.length > site.materials.filter(m => m.riskLevel === 'CRITICAL' || m.riskLevel === 'HIGH').length && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSite(site.siteId)}
                  >
                    Voir tous les matériaux ({site.materials.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
