import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { TrendingUp, Calendar, Package, RefreshCw } from 'lucide-react';
import materialService, { Material } from '../../../services/materialService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

interface MaterialForecastProps {
  materials: Material[];
}

export default function MaterialForecast({ materials }: MaterialForecastProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedMaterial) {
      loadForecast(selectedMaterial);
    }
  }, [selectedMaterial]);

  const loadForecast = async (materialId: string) => {
    setLoading(true);
    try {
      const data = await materialService.getForecast(materialId);
      setForecast(data);
    } catch (error) {
      console.error('Error loading forecast:', error);
      toast.error('Erreur lors du chargement des prévisions');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!selectedMaterial) return;
    
    try {
      const result = await materialService.reorderMaterial(selectedMaterial);
      if (result.success) {
        toast.success(`Commande créée! Livraison prévue: ${new Date(result.expectedDelivery).toLocaleDateString()}`);
        loadForecast(selectedMaterial);
      }
    } catch (error) {
      toast.error('Échec de la commande');
    }
  };

  const chartData = forecast?.trends?.map((trend: any) => ({
    date: new Date(trend.date).toLocaleDateString(),
    consommation: trend.consumption,
  })) || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prévisions de consommation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
            >
              <option value="">Sélectionner un matériau...</option>
              {materials.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          {loading && <div className="text-center py-8">Chargement des prévisions...</div>}

          {forecast && !loading && (
            <div className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.currentStock}</div>
                    <p className="text-sm text-gray-500">Stock actuel</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.dailyConsumption?.toFixed(2) || 0}</div>
                    <p className="text-sm text-gray-500">Consommation journalière</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.daysRemaining?.toFixed(1) || 0}</div>
                    <p className="text-sm text-gray-500">Jours restants</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{forecast.suggestedOrderQuantity || 0}</div>
                    <p className="text-sm text-gray-500">Quantité recommandée</p>
                  </CardContent>
                </Card>
              </div>

              {/* Date de commande */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Date de commande recommandée:</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {forecast.reorderDate ? new Date(forecast.reorderDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Graphique */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tendance des 7 derniers jours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="consommation" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleReorder}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Créer une commande
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => loadForecast(selectedMaterial)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}