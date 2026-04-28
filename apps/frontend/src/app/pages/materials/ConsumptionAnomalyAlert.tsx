import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { AlertTriangle, TrendingDown, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import consumptionService, { ConsumptionRecord, AnomalyResult } from '../../../services/consumptionService';

interface ConsumptionAnomalyAlertProps {
  materialId?: string;
  siteId?: string;
  onAnomalyDetected?: (anomaly: AnomalyResult) => void;
}

export default function ConsumptionAnomalyAlert({ materialId, siteId, onAnomalyDetected }: ConsumptionAnomalyAlertProps) {
  const [anomalies, setAnomalies] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnomalies();
  }, [materialId, siteId]);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      let data: ConsumptionRecord[];
      if (materialId) {
        data = await consumptionService.getByMaterial(materialId);
      } else if (siteId) {
        data = await consumptionService.getBySite(siteId);
      } else {
        data = await consumptionService.getActiveAnomalies();
      }
      setAnomalies(data);

      const top = data.find((d) => d.anomalyType !== 'normal');
      if (top && onAnomalyDetected) {
        onAnomalyDetected({
          consumption: top,
          anomalyType: top.anomalyType === 'vol' ? 'VOL_POSSIBLE' : 'CHANTIER_BLOQUE',
          anomalyScore: top.anomalyScore,
          message: top.anomalyReason,
          severity: top.anomalyType === 'vol' ? 'critical' : 'warning',
        });
      }
    } catch (error) {
      console.error('Erreur chargement anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'vol':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'probleme':
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getAnomalyBadge = (type: string) => {
    switch (type) {
      case 'vol':
        return <Badge variant="destructive" className="bg-red-500">VOL POSSIBLE</Badge>;
      case 'probleme':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">CHANTIER BLOQUE</Badge>;
      default:
        return <Badge variant="default" className="bg-green-500">NORMAL</Badge>;
    }
  };

  const handleResendAlert = async (recordId: string) => {
    try {
      await consumptionService.resendAlert(recordId);
      toast.success('Alerte renvoyee avec succes');
      loadAnomalies();
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement des anomalies...</p>
        </CardContent>
      </Card>
    );
  }

  const criticalAnomalies = anomalies.filter(a => a.anomalyType === 'vol');
  const warningAnomalies = anomalies.filter(a => a.anomalyType === 'probleme');
  const normalRecords = anomalies.filter(a => a.anomalyType === 'normal');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200"><CardContent className="p-4"><p className="text-sm text-gray-500">Alertes critiques</p><p className="text-2xl font-bold text-red-600">{criticalAnomalies.length}</p></CardContent></Card>
        <Card className="border-yellow-200"><CardContent className="p-4"><p className="text-sm text-gray-500">Avertissements</p><p className="text-2xl font-bold text-yellow-600">{warningAnomalies.length}</p></CardContent></Card>
        <Card className="border-green-200"><CardContent className="p-4"><p className="text-sm text-gray-500">Consommations normales</p><p className="text-2xl font-bold text-green-600">{normalRecords.length}</p></CardContent></Card>
      </div>

      {anomalies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>Aucune anomalie detectee</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detection intelligente des anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly) => (
                <div key={anomaly._id} className="p-4 rounded-lg border-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAnomalyIcon(anomaly.anomalyType)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getAnomalyBadge(anomaly.anomalyType)}
                          <span className="text-xs text-gray-500">Score: {Math.round(anomaly.anomalyScore)}%</span>
                        </div>
                        <p className="font-medium">{anomaly.anomalyReason}</p>
                      </div>
                    </div>
                    {!anomaly.emailSent && anomaly.anomalyType !== 'normal' && (
                      <Button size="sm" variant="outline" onClick={() => handleResendAlert(anomaly._id)}>
                        <Mail className="h-4 w-4 mr-1" />
                        Envoyer alerte
                      </Button>
                    )}
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
