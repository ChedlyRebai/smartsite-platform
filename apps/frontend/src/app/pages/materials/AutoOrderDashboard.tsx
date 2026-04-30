import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { AlertTriangle, Package, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import intelligentOrderService, { AutoOrderRecommendation } from '../../../services/intelligentOrderService';
import AutoOrderButton from './AutoOrderButton';

interface AutoOrderDashboardProps {
  siteId?: string;
  onRefresh?: () => void;
}

export default function AutoOrderDashboard({ siteId, onRefresh }: AutoOrderDashboardProps) {
  const [recommendations, setRecommendations] = useState<AutoOrderRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [siteId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await intelligentOrderService.getAutoOrderRecommendations(siteId);
      setRecommendations(data);

      const criticalCount = data.filter(r => r.urgencyLevel === 'critical').length;
      if (criticalCount > 0) {
        toast.error(`${criticalCount} materiau(x) necessitent une commande URGENTE!`, { duration: 10000 });
      } else if (data.length > 0) {
        toast.warning(`${data.length} materiau(x) necessitent une commande`, { duration: 5000 });
      }
    } catch (error) {
      console.error('Error loading auto order recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
    onRefresh?.();
  };

  const criticalItems = recommendations.filter(r => r.urgencyLevel === 'critical');
  const warningItems = recommendations.filter(r => r.urgencyLevel === 'warning');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Analyse des stocks en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Package className="h-12 w-12 mx-auto text-green-400" />
          <p className="mt-2 text-gray-500">Tous les stocks sont suffisants</p>
          <p className="text-sm text-gray-400">Aucun materiau ne necessite de commande pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-yellow-500" />
            Commandes recommandees ({recommendations.length})
          </h3>
          <p className="text-sm text-gray-500">
            Base sur la prediction IA: commande automatique si rupture {'<'} 48h
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {criticalItems.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" />
              Urgent - Rupture imminente ({criticalItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalItems.map((rec) => (
                <div key={rec.materialId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rec.materialName}</span>
                      <span className="text-sm text-gray-500">({rec.materialCode})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-1 text-sm">
                      <div><span className="text-gray-500">Stock:</span><span className="font-medium ml-1">{rec.currentStock}</span></div>
                      <div><span className="text-gray-500">Consommation:</span><span className="font-medium ml-1">{rec.consumptionRate}/h</span></div>
                      <div><span className="text-gray-500">Rupture dans:</span><span className="font-medium text-red-600 ml-1">{rec.predictedHoursToOutOfStock}h</span></div>
                    </div>
                    <p className="text-xs text-red-600 mt-1">{rec.reason}</p>
                  </div>
                  <AutoOrderButton
                    materialId={rec.materialId}
                    materialName={rec.materialName}
                    materialCode={rec.materialCode}
                    onOrderCreated={handleRefresh}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {warningItems.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-700 flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              A surveiller - Stock bas ({warningItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warningItems.map((rec) => (
                <div key={rec.materialId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rec.materialName}</span>
                      <span className="text-sm text-gray-500">({rec.materialCode})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-1 text-sm">
                      <div><span className="text-gray-500">Stock:</span><span className="font-medium ml-1">{rec.currentStock}</span></div>
                      <div><span className="text-gray-500">Seuil:</span><span className="font-medium ml-1">{rec.recommendedQuantity} recommande</span></div>
                      <div><span className="text-gray-500">Lead time:</span><span className="font-medium ml-1">{rec.leadTimeDays} jours</span></div>
                    </div>
                  </div>
                  <AutoOrderButton
                    materialId={rec.materialId}
                    materialName={rec.materialName}
                    materialCode={rec.materialCode}
                    onOrderCreated={handleRefresh}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
