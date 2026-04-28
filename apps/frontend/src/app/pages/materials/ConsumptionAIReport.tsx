"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { toast } from "sonner";
import { 
  Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Shield, AlertCircle, Info, Loader2, FileText, X, RefreshCw
} from "lucide-react";
import axios from "axios";

interface ConsumptionAlert {
  type: 'NORMAL' | 'GASPILLAGE' | 'VOL_POSSIBLE' | 'OVER_CONSUMPTION' | 'ANOMALIE';
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';
  message: string;
  date: string;
  quantity: number;
  expectedQuantity: number;
  deviation: number;
}

interface ConsumptionAnalysisReport {
  materialId: string;
  materialName: string;
  materialCode: string;
  siteId: string;
  siteName: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totalConsumption: number;
  averageDailyConsumption: number;
  expectedConsumption: number;
  consumptionStatus: 'NORMAL' | 'OVER_CONSUMPTION' | 'UNDER_CONSUMPTION';
  deviationPercentage: number;
  alerts: ConsumptionAlert[];
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  possibleIssues: string[];
}

interface ConsumptionAIReportProps {
  materialId: string;
  siteId: string;
  materialName?: string;
  open: boolean;
  onClose: () => void;
}

export default function ConsumptionAIReport({
  materialId,
  siteId,
  materialName,
  open,
  onClose,
}: ConsumptionAIReportProps) {
  const [report, setReport] = useState<ConsumptionAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/consumption-history/ai-report/${materialId}/${siteId}`,
        { params: { days } }
      );

      if (data.success && data.report) {
        setReport(data.report);
        toast.success('Rapport IA généré avec succès!');
      } else {
        toast.error(data.message || 'Erreur lors de la génération du rapport');
      }
    } catch (error: any) {
      console.error('Error generating AI report:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && !report) {
      generateReport();
    }
  }, [open]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVER_CONSUMPTION': return 'bg-red-100 text-red-700';
      case 'UNDER_CONSUMPTION': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'DANGER': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'WARNING': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-300';
      case 'DANGER': return 'bg-orange-50 border-orange-300';
      case 'WARNING': return 'bg-yellow-50 border-yellow-300';
      default: return 'bg-blue-50 border-blue-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              Rapport d'Analyse IA - {materialName || 'Matériau'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Génération du rapport IA en cours...</p>
            <p className="text-sm text-gray-500 mt-2">Analyse de {days} jours de données</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* En-tête du rapport */}
            <Card className={`border-2 ${getRiskLevelColor(report.riskLevel)}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Matériau</p>
                    <p className="font-bold text-lg">{report.materialName}</p>
                    <p className="text-sm text-gray-500">{report.materialCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Niveau de Risque</p>
                    <Badge className={`text-lg px-4 py-2 ${getRiskLevelColor(report.riskLevel)}`}>
                      {report.riskLevel === 'CRITICAL' ? '🚨 CRITIQUE' :
                       report.riskLevel === 'HIGH' ? '⚠️ ÉLEVÉ' :
                       report.riskLevel === 'MEDIUM' ? '📊 MOYEN' : '✅ FAIBLE'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Consommation Totale</p>
                  <p className="text-2xl font-bold">{report.totalConsumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">sur {report.period.days} jours</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Moyenne Journalière</p>
                  <p className="text-2xl font-bold">{report.averageDailyConsumption.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">unités/jour</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Écart</p>
                  <p className={`text-2xl font-bold ${report.deviationPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {report.deviationPercentage > 0 ? '+' : ''}{report.deviationPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">vs attendu</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Statut</p>
                  <Badge className={getStatusColor(report.consumptionStatus)}>
                    {report.consumptionStatus === 'OVER_CONSUMPTION' ? 'SURCONSO' :
                     report.consumptionStatus === 'UNDER_CONSUMPTION' ? 'SOUS-CONSO' : 'NORMAL'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Problèmes Possibles */}
            {report.possibleIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-red-600" />
                    Problèmes Détectés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.possibleIssues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800">{issue}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alertes */}
            {report.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Alertes ({report.alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {report.alerts
                      .filter(alert => alert.severity !== 'INFO')
                      .slice(0, 10)
                      .map((alert, index) => (
                        <div key={index} className={`flex items-start gap-3 p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(alert.date).toLocaleDateString('fr-FR')} - 
                              Quantité: {alert.quantity} (attendu: {alert.expectedQuantity.toFixed(1)})
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommandations */}
            {report.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Recommandations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <p className="text-sm text-green-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => generateReport()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer
              </Button>
              <Button onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Aucun rapport disponible</p>
            <Button className="mt-4" onClick={generateReport}>
              Générer le rapport
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
