import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Brain, TrendingUp, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import materialService from '../../../services/materialService';

interface Prediction {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  consumptionRate: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  confidence: number;
  message: string;
  siteCoordinates?: { lat: number; lng: number };
  weather?: {
    temperature: number;
    description: string;
    condition: string;
    icon: string;
  };
}

export default function PredictionsList() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  useEffect(() => {
    loadPredictions();
    const interval = setInterval(loadPredictions, 60000); // Rafraîchir toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const loadPredictions = async () => {
    try {
      const data = await materialService.getAllPredictions();
      const validPredictions = data.filter(p => p !== null);
      
      // Charger la météo pour chaque prédiction avec coordonnées
      const predictionsWithWeather = await Promise.all(
        validPredictions.map(async (pred) => {
          if (pred.siteCoordinates?.lat && pred.siteCoordinates?.lng) {
            try {
              const response = await fetch(
                `http://localhost:3002/api/materials/weather?lat=${pred.siteCoordinates.lat}&lng=${pred.siteCoordinates.lng}`
              );
              const weatherData = await response.json();
              if (weatherData.success && weatherData.weather) {
                return { ...pred, weather: weatherData.weather };
              }
            } catch (error) {
              console.error('Error loading weather for prediction:', error);
            }
          }
          return pred;
        })
      );
      
      setPredictions(predictionsWithWeather);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Attention</Badge>;
      default:
        return <Badge variant="default" className="bg-green-500 text-white">Sécurisé</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Brain className="h-4 w-4 text-green-500" />;
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.floor(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
  };

  const filteredPredictions = predictions.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const criticalCount = predictions.filter(p => p.status === 'critical').length;
  const warningCount = predictions.filter(p => p.status === 'warning').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Analyse des stocks en cours...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Prédictions IA
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalCount} rupture imminente{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 text-xs rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Tous ({predictions.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-2 py-1 text-xs rounded ${filter === 'critical' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
            >
              Critique ({criticalCount})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-2 py-1 text-xs rounded ${filter === 'warning' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}
            >
              Attention ({warningCount})
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Aucune prédiction à afficher</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPredictions.map((prediction) => (
              <div
                key={prediction.materialId}
                className={`p-3 rounded-lg border ${
                  prediction.status === 'critical' 
                    ? 'border-red-200 bg-red-50' 
                    : prediction.status === 'warning'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(prediction.status)}
                      <span className="font-medium">{prediction.materialName}</span>
                      {getStatusBadge(prediction.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Stock actuel:</span>
                        <span className="ml-1 font-medium">{prediction.currentStock}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Consommation:</span>
                        <span className="ml-1 font-medium">{prediction.consumptionRate}/h</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Stock prédit (24h):</span>
                        <span className="ml-1 font-medium">{Math.max(0, Math.floor(prediction.predictedStock))}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Confiance:</span>
                        <span className="ml-1 font-medium">{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className={`${prediction.hoursToLowStock < 24 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                        ⚠️ Stock bas: {formatHours(prediction.hoursToLowStock)}
                      </span>
                      <span className={`${prediction.hoursToOutOfStock < 24 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                        🚨 Rupture: {formatHours(prediction.hoursToOutOfStock)}
                      </span>
                      {prediction.recommendedOrderQuantity > 0 && (
                        <span className="text-blue-600">
                          📦 Commande recommandée: {Math.ceil(prediction.recommendedOrderQuantity)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs mt-2 text-gray-500">
                      {prediction.message}
                    </p>

                    {prediction.weather && (
                      <div className="mt-2 pt-2 border-t bg-blue-50 -mx-3 -mb-3 px-3 py-2 rounded-b-lg">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-xl">{prediction.weather.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-blue-700">
                              {prediction.weather.temperature}°C - {prediction.weather.description}
                            </div>
                            <div className="text-blue-600 text-[10px]">
                              {prediction.weather.condition === 'rainy' || prediction.weather.condition === 'stormy' ? 
                                '⚠️ Conditions difficiles - Consommation peut augmenter' :
                                prediction.weather.condition === 'sunny' ?
                                '✅ Conditions optimales' :
                                '☁️ Conditions normales'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}