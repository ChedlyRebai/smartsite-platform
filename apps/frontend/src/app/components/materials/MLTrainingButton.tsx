import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Brain, Loader2, TrendingUp, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface StockPredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  consumptionRate: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  predictionModelUsed: boolean;
  confidence: number;
  message: string;
  weatherImpact?: string;
}

interface MLTrainingButtonProps {
  materialId: string;
  materialName: string;
  className?: string;
}

export default function MLTrainingButton({ materialId, materialName, className }: MLTrainingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<StockPredictionResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [lastTraining, setLastTraining] = useState<Date | null>(null);

  // Éviter les entraînements trop fréquents (cooldown de 30 secondes)
  const canTrain = () => {
    if (!lastTraining) return true;
    const cooldownMs = 30 * 1000; // 30 secondes
    return Date.now() - lastTraining.getTime() > cooldownMs;
  };

  const getCooldownText = () => {
    if (!lastTraining || canTrain()) return '';
    const remainingSeconds = Math.ceil((30 * 1000 - (Date.now() - lastTraining.getTime())) / 1000);
    return ` (${remainingSeconds}s)`;
  };

  const handleTrainModel = async () => {
    if (!canTrain()) {
      const remainingSeconds = Math.ceil((30 * 1000 - (Date.now() - lastTraining!.getTime())) / 1000);
      toast.warning(`⏳ Veuillez attendre ${remainingSeconds}s avant le prochain entraînement`);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/ml-training/train-stock-prediction/${materialId}`);
      const result = response.data;
      
      setPrediction(result.stockPrediction);
      setLastTraining(new Date());
      setShowResults(true);
      
      toast.success(result.message);
    } catch (error: any) {
      console.error('Error training ML model:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'entraînement du modèle');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (hours: number): string => {
    if (hours < 0) return '0h';
    if (hours < 1) return `${Math.ceil(hours * 60)} min`;
    if (hours < 24) return `${Math.ceil(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.ceil(hours % 24);
    return `${days}j ${remainingHours}h`;
  };

  return (
    <>
      <Button
        onClick={handleTrainModel}
        disabled={loading || !canTrain()}
        className={`${className} flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50`}
        title="Entraîner le modèle ML de prédiction de stock"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Brain className="h-4 w-4" />
        )}
        {loading ? 'Entraînement...' : `Entraîner ML${getCooldownText()}`}
      </Button>

      {/* Dialog des résultats */}
      {showResults && prediction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                Prédiction IA de Stock
              </CardTitle>
              <p className="text-purple-100">Résultats pour {prediction.materialName}</p>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Statut général */}
              <div className={`p-4 rounded-lg border-2 ${getStatusColor(prediction.status)}`}>
                <div className="flex items-center gap-3">
                  {getStatusIcon(prediction.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {prediction.status === 'safe' && '✅ Stock Sécurisé'}
                      {prediction.status === 'warning' && '⚠️ Attention Stock Bas'}
                      {prediction.status === 'critical' && '🚨 Risque de Rupture'}
                    </h3>
                    <p className="text-sm mt-1">{prediction.message}</p>
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    {prediction.confidence}% confiance
                  </Badge>
                </div>
              </div>

              {/* Métriques principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Stock Actuel</p>
                  <p className="text-xl font-bold text-blue-600">{prediction.currentStock}</p>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Consommation</p>
                  <p className="text-xl font-bold text-orange-600">{prediction.consumptionRate.toFixed(1)}/h</p>
                </div>

                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Stock Bas Dans</p>
                  <p className="text-lg font-bold text-yellow-600">{formatTime(prediction.hoursToLowStock)}</p>
                </div>

                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Rupture Dans</p>
                  <p className="text-lg font-bold text-red-600">{formatTime(prediction.hoursToOutOfStock)}</p>
                </div>
              </div>

              {/* Recommandations */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">📋 Recommandations</h4>
                
                {prediction.recommendedOrderQuantity > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-700">Quantité Recommandée</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{prediction.recommendedOrderQuantity} unités</p>
                    <p className="text-sm text-green-600 mt-1">
                      Cette quantité devrait couvrir les besoins pour les prochains jours
                    </p>
                  </div>
                )}

                {/* Impact météo */}
                {prediction.weatherImpact && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌤️</span>
                      <span className="font-semibold text-blue-700">Impact Météo</span>
                    </div>
                    <p className="text-blue-600">{prediction.weatherImpact}</p>
                  </div>
                )}

                {/* Modèle ML utilisé */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-700">Modèle ML</span>
                  </div>
                  <p className="text-purple-600">
                    {prediction.predictionModelUsed 
                      ? `✅ Modèle entraîné avec succès (${prediction.confidence}% de confiance)`
                      : '⚠️ Prédiction basée sur les données historiques'
                    }
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowResults(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Fermer
                </Button>
                {prediction.recommendedOrderQuantity > 0 && (
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      toast.info('Redirection vers la création de commande...');
                      // Ici, vous pouvez ajouter la logique pour ouvrir le dialog de commande
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Commander {prediction.recommendedOrderQuantity} unités
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}