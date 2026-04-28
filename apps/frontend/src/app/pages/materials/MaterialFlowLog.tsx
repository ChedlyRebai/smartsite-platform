import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlertTriangle, 
  AlertCircle,
  Loader2,
  Calendar,
  Package,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import materialFlowService, { MaterialFlow, FlowType, AnomalyType } from '../../../services/materialFlowService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MaterialFlowLogProps {
  materialId?: string;
  siteId?: string;
}

export default function MaterialFlowLog({ materialId, siteId }: MaterialFlowLogProps) {
  const [flows, setFlows] = useState<MaterialFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<MaterialFlow[]>([]);
  const [filter, setFilter] = useState<'all' | 'IN' | 'OUT' | 'anomaly'>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadFlows();
    loadAnomalies();
  }, [materialId, siteId]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      // Use enriched flows endpoint to get material/site names
      const data = await materialFlowService.getEnrichedFlows({
        materialId,
        siteId,
        limit: 100,
      });
      setFlows(data.data);

      if (materialId && siteId) {
        const statsData = await materialFlowService.getFlowStatistics(materialId, siteId);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
      toast.error('Erreur chargement des mouvements');
    } finally {
      setLoading(false);
    }
  };

  const loadAnomalies = async () => {
    try {
      const data = await materialFlowService.getAnomalies();
      setAnomalies(data);
    } catch (error) {
      console.error('Error loading anomalies:', error);
    }
  };

  const getFilteredFlows = () => {
    if (filter === 'anomaly') {
      return flows.filter(f => f.anomalyDetected !== AnomalyType.NONE);
    }
    if (filter === 'IN' || filter === 'OUT') {
      return flows.filter(f => f.type === filter);
    }
    return flows;
  };

  const getFlowIcon = (type: FlowType) => {
    switch (type) {
      case FlowType.IN:
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case FlowType.OUT:
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAnomalyBadge = (type: AnomalyType) => {
    if (type === AnomalyType.NONE) return null;
    
    const config = {
      [AnomalyType.EXCESSIVE_OUT]: { label: 'Sortie excessive', color: 'bg-red-100 text-red-700' },
      [AnomalyType.EXCESSIVE_IN]: { label: 'Entrée excessive', color: 'bg-yellow-100 text-yellow-700' },
      [AnomalyType.BELOW_SAFETY_STOCK]: { label: 'Stock critique', color: 'bg-orange-100 text-orange-700' },
      [AnomalyType.UNEXPECTED_MOVEMENT]: { label: 'Mouvement inattendu', color: 'bg-purple-100 text-purple-700' },
    };
    
    const cfg = config[type];
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  const getTypeLabel = (type: FlowType) => {
    switch (type) {
      case FlowType.IN: return 'Entrée';
      case FlowType.OUT: return 'Sortie';
      case FlowType.DAMAGE: return 'Endommagé';
      case FlowType.RESERVE: return 'Réservé';
      case FlowType.RETURN: return 'Retour';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      {stats && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.statistics?.find((s: any) => s._id === 'OUT')?.totalQuantity || 0}</p>
                <p className="text-xs text-gray-500">Sorties (30j)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.statistics?.find((s: any) => s._id === 'IN')?.totalQuantity || 0}</p>
                <p className="text-xs text-gray-500">Entrées (30j)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.statistics?.reduce((sum: number, s: any) => sum + s.anomalies, 0) || 0}</p>
                <p className="text-xs text-gray-500">Anomalies</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.statistics?.reduce((sum: number, s: any) => sum + s.count, 0) || 0}</p>
                <p className="text-xs text-gray-500">Mouvements totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tous
        </Button>
        <Button 
          variant={filter === 'IN' ? 'default' : 'outline'} 
          size="sm"
          className={filter === 'IN' ? 'bg-green-500' : ''}
          onClick={() => setFilter('IN')}
        >
          <ArrowDownCircle className="h-4 w-4 mr-1" />
          Entrées
        </Button>
        <Button 
          variant={filter === 'OUT' ? 'default' : 'outline'} 
          size="sm"
          className={filter === 'OUT' ? 'bg-red-500' : ''}
          onClick={() => setFilter('OUT')}
        >
          <ArrowUpCircle className="h-4 w-4 mr-1" />
          Sorties
        </Button>
        <Button 
          variant={filter === 'anomaly' ? 'default' : 'outline'} 
          size="sm"
          className={filter === 'anomaly' ? 'bg-yellow-500' : ''}
          onClick={() => setFilter('anomaly')}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Anomalies ({anomalies.length})
        </Button>
        <Button variant="ghost" size="sm" onClick={loadFlows}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      {(flows.length > 0 || stats) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {flows.filter(f => f.type === 'IN' || f.type === 'RETURN')
                    .reduce((sum, f) => sum + f.quantity, 0)}
                </p>
                <p className="text-xs text-gray-600">Total Entrées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {flows.filter(f => f.type === 'OUT' || f.type === 'DAMAGE' || f.type === 'ADJUSTMENT')
                    .reduce((sum, f) => sum + f.quantity, 0)}
                </p>
                <p className="text-xs text-gray-600">Total Sorties</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {flows.filter(f => f.anomalyDetected !== AnomalyType.NONE).length}
                </p>
                <p className="text-xs text-gray-600">Anomalies</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{flows.length}</p>
                <p className="text-xs text-gray-600">Journaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flows List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Journal des mouvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : getFilteredFlows().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredFlows().map((flow) => (
                <div 
                  key={flow._id} 
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    flow.anomalyDetected !== AnomalyType.NONE ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getFlowIcon(flow.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getTypeLabel(flow.type)}: {flow.quantity} unités
                        </span>
                        {getAnomalyBadge(flow.anomalyDetected)}
                      </div>
                       <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                         <span className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {format(new Date(flow.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                         </span>
                         {(flow as any).materialName && (
                           <span className="text-gray-400">• {(flow as any).materialName} - {(flow as any).materialCode}</span>
                         )}
                         {(flow as any).siteName && (
                           <span className="text-gray-400">• {(flow as any).siteName}</span>
                         )}
                         {flow.reason && (
                           <span className="text-gray-400">• {flow.reason}</span>
                         )}
                       </div>
                       {flow.anomalyMessage && (
                         <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                           <AlertCircle className="h-3 w-3" />
                           {flow.anomalyMessage}
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm">
                       Stock: <span className="font-medium">{flow.previousStock}</span> → 
                       <span className={`font-medium ${flow.newStock < flow.previousStock ? 'text-red-600' : 'text-green-600'}`}>
                         {flow.newStock}
                       </span>
                     </div>
                     {(flow as any).userName && (
                       <div className="text-xs text-gray-400">Utilisateur: {(flow as any).userName}</div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anomalies Summary */}
      {anomalies.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Anomalies non résolues ({anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((anomaly) => (
                <div key={anomaly._id} className="p-2 border-b last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{anomaly.materialName || 'Matériau'}</span>
                    <span className="text-sm text-red-600">{anomaly.anomalyMessage?.substring(0, 50)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}