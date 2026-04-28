import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Brain, Calendar, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import aiPredictionService, { StockPrediction, PredictionParams } from '../../../services/aiPredictionService';

interface AIPredictionWidgetProps {
  material: {
    _id: string;
    name: string;
    quantity: number;
    category: string;
    siteId?: string;
    siteName?: string;
    siteCoordinates?: { lat: number; lng: number };
    siteAddress?: string;
  };
  onPredictionUpdate?: (prediction: StockPrediction) => void;
}

export default function AIPredictionWidget({ material, onPredictionUpdate }: AIPredictionWidgetProps) {
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    generatePrediction();
  }, [material._id, material.quantity]);

  const generatePrediction = async () => {
    if (!material._id || material.quantity === undefined) {
      setError('Données matériau insuffisantes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: PredictionParams = {
        materialId: material._id,
        materialName: material.name,
        currentStock: material.quantity,
        category: material.category,
        siteCoordinates: material.siteCoordinates,
        siteAddress: material.siteAddress,
        projectType: 'construction', // Par défaut
        activityLevel: 0.8 // Par défaut
      };

      const predictionResult = await aiPredictionService.generateStockPrediction(params);
      setPrediction(predictionResult);
      setLastUpdate(new Date());
      
      if (onPredictionUpdate) {
        onPredictionUpdate(predictionResult);
      }

      // Toast selon le niveau de risque
      if (predictionResult.riskLevel === 'HIGH') {
        toast.error(`🚨 ${material.name}: Rupture prévue dans ${predictionResult.daysUntilOutOfStock} jours!`);
      } else if (predictionResult.riskLevel === 'MEDIUM') {
        toast.warning(`⚠️ ${material.name}: Stock bas prévu dans ${predictionResult.daysUntilOutOfStock} jours`);
      }

    } catch (err: any) {
      console.error('Error generating prediction:', err);
      setError('Impossible de générer la prédiction');
      toast.error('Erreur lors de la génération de la prédiction AI');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'HIGH': return 'RISQUE ÉLEVÉ';
      case 'MEDIUM': return 'ATTENTION';
      case 'LOW': return 'SÉCURISÉ';
      default: return 'INCONNU';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getProgressColor = (days: number) => {
    if (days <= 3) return 'bg-red-500';
    if (days <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressValue = (days: number) => {
    const maxDays = 30; // 30 jours = 100%
    return Math.min(100, Math.max(0, (days / maxDays) * 100));
  };

  if (loading && !prediction) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Prédiction AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">Génération en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !prediction) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Prédiction AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button size="sm" variant="outline" onClick={generatePrediction}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Prédiction AI
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={generatePrediction}
            disabled={loading}
            title="Actualiser la prédiction"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut de risque */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Statut:</span>
          <Badge className={`${getRiskColor(prediction.riskLevel)} text-white`}>
            {getRiskLabel(prediction.riskLevel)}
          </Badge>
        </div>

        {/* Prédiction de rupture */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rupture prévue:</span>
            <span className="font-semibold">
              {prediction.daysUntilOutOfStock <= 0 ? 'Immédiate' : `${prediction.daysUntilOutOfStock} jours`}
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="space-y-1">
            <Progress 
              value={getProgressValue(prediction.daysUntilOutOfStock)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Critique</span>
              <span>Sécurisé</span>
            </div>
          </div>
        </div>

        {/* Date de rupture */}
        {prediction.daysUntilOutOfStock > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Le {formatDate(prediction.predictedOutOfStockDate)}</span>
          </div>
        )}

        {/* Recommandation de commande */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Recommandation</span>
          </div>
          <p className="text-sm text-blue-700">
            Commander {prediction.recommendedOrderQuantity} {material.category || 'unités'}
          </p>
        </div>

        {/* Facteurs d'analyse */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Consommation:</span>
            <span className="font-medium">{prediction.factors.consumptionRate}/jour</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Activité projet:</span>
            <span className="font-medium">{Math.round(prediction.factors.projectActivity * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Impact météo:</span>
            <span className={`font-medium ${
              prediction.factors.weatherMultiplier > 1.0 ? 'text-red-600' : 
              prediction.factors.weatherMultiplier < 1.0 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {prediction.factors.weatherMultiplier > 1.0 ? '+' : ''}
              {Math.round((prediction.factors.weatherMultiplier - 1.0) * 100)}%
            </span>
          </div>
        </div>

        {/* Confiance */}
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-gray-500">Confiance:</span>
          <span className="font-semibold text-green-600">{prediction.confidence}%</span>
        </div>

        {/* Recommandations principales */}
        {prediction.recommendations.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700">Actions recommandées:</p>
            {prediction.recommendations.slice(0, 2).map((rec, index) => (
              <p key={index} className="text-xs text-gray-600">• {rec}</p>
            ))}
          </div>
        )}

        {/* Dernière mise à jour */}
        {lastUpdate && (
          <div className="text-xs text-gray-400 text-center pt-2 border-t">
            Mis à jour {lastUpdate.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}