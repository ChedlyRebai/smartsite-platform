import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { toast } from 'sonner';
import { 
  Upload, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Loader2,
  Package,
  AlertCircle
} from 'lucide-react';
import materialService from '../../../services/materialService';

interface MaterialMLTrainingProps {
  materialId: string;
  materialName: string;
  currentStock: number;
  reorderPoint: number;
}

interface ModelInfo {
  modelTrained: boolean;
  hasHistoricalData: boolean;
  sampleSize?: number;
  trainedAt?: Date;
}

interface PredictionResult {
  predictedStock: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  consumptionRate: number;
  modelTrained: boolean;
  confidence: number;
  status: 'safe' | 'warning' | 'critical';
  message: string;
}

export default function MaterialMLTraining({ 
  materialId, 
  materialName, 
  currentStock, 
  reorderPoint 
}: MaterialMLTrainingProps) {
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkModelInfo();
  }, [materialId]);

  const checkModelInfo = async () => {
    try {
      const info = await materialService.getModelInfo(materialId);
      setModelInfo(info);
    } catch (error) {
      console.error('Error checking model info:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setUploading(true);
    try {
      const result = await materialService.uploadHistoricalData(materialId, file);
      toast.success(result.message);
      await checkModelInfo();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTrainModel = async () => {
    setTraining(true);
    try {
      const result = await materialService.trainModel(materialId);
      toast.success(result.message);
      await checkModelInfo();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'entraînement');
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async (hours: number = 24) => {
    setPredicting(true);
    try {
      // Use the same endpoint as MaterialDetails for consistent results
      const result = await materialService.getStockPrediction(materialId);
      setPrediction(result);
      if (result.status === 'critical') {
        toast.error(result.message);
      } else if (result.status === 'warning') {
        toast.warning(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la prédiction');
    } finally {
      setPredicting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-700 border-green-300';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'safe': return 'Sécurisé';
      case 'warning': return 'Attention';
      case 'critical': return 'Critique';
      default: return 'Inconnu';
    }
  };

  return (
    <Card className="w-full border-2 border-purple-200">
      <CardHeader className="pb-3 bg-purple-50">
        <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
          <Brain className="h-5 w-5" />
          Prédiction IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions Row */}
        <div className="flex items-center gap-2">
          {/* Upload Historical Data */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              size="sm"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Historique
            </Button>
            {modelInfo?.hasHistoricalData && (
              <p className="text-xs text-center text-green-600 mt-1">
                ✓ {modelInfo?.sampleSize || 0} données
              </p>
            )}
          </div>

          {/* Train Model */}
          <div className="flex-1">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleTrainModel}
              disabled={!modelInfo?.hasHistoricalData || training}
              size="sm"
            >
              {training ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Entraîner
            </Button>
            {modelInfo?.modelTrained && (
              <p className="text-xs text-center text-green-600 mt-1">
                ✓ Modèle prêt
              </p>
            )}
          </div>

          {/* Predict */}
          <div className="flex-1">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => handlePredict(24)}
              disabled={predicting}
              size="sm"
            >
              {predicting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Prédire
            </Button>
          </div>
        </div>

        {/* Prediction Results */}
        {prediction && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Rupture de stock dans:</span>
              <span className={`font-bold ${prediction.hoursToOutOfStock < 24 ? 'text-red-600' : prediction.hoursToOutOfStock < 72 ? 'text-yellow-600' : 'text-green-600'}`}>
                {prediction.hoursToOutOfStock}h
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Consommation:</span>
              <span className="font-medium">{prediction.consumptionRate}/h</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Stock prédit (24h):</span>
              <span className="font-medium">{prediction.predictedStock} unités</span>
            </div>
            {prediction.hoursToOutOfStock < 24 && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2 p-2 bg-red-50 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>Attention: Rupture imminente!</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}