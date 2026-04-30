import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertTriangle, X, Mail, Eye, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface AnomalyData {
  materialId: string;
  materialName: string;
  anomalyResult: {
    isAnomaly: boolean;
    anomalyType: 'EXCESSIVE_OUT' | 'SUSPICIOUS_PATTERN' | 'NORMAL';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    deviationPercentage: number;
    recommendedAction: string;
    shouldSendAlert: boolean;
  };
  timestamp: Date;
}

interface AnomalyAlertProps {
  anomalyData: AnomalyData;
  onClose: () => void;
  onViewDetails?: () => void;
}

export default function AnomalyAlert({ anomalyData, onClose, onViewDetails }: AnomalyAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  const { anomalyResult } = anomalyData;

  // Vérification de sécurité pour éviter les erreurs
  if (!anomalyResult) {
    console.warn('AnomalyAlert: anomalyResult is undefined');
    return null;
  }

  useEffect(() => {
    // Auto-fermer après 30 secondes pour les anomalies de niveau bas
    if (anomalyResult?.riskLevel === 'LOW') {
      const timer = setTimeout(() => {
        handleClose();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [anomalyResult?.riskLevel]);

  useEffect(() => {
    // Simuler l'envoi d'email pour les anomalies critiques
    if (anomalyResult?.shouldSendAlert && anomalyResult?.riskLevel === 'HIGH') {
      setTimeout(() => {
        setEmailSent(true);
        toast.success('📧 Alerte email envoyée aux responsables');
      }, 2000);
    }
  }, [anomalyResult]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Délai pour l'animation
  };

  const getRiskColor = () => {
    if (!anomalyResult) return 'border-gray-500 bg-gray-50';
    switch (anomalyResult.riskLevel) {
      case 'HIGH': return 'border-red-500 bg-red-50';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50';
      case 'LOW': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getRiskIcon = () => {
    if (!anomalyResult) return '📊';
    switch (anomalyResult.riskLevel) {
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return '⚡';
      default: return '📊';
    }
  };

  const getRiskLabel = () => {
    if (!anomalyResult) return 'NORMAL';
    switch (anomalyResult.riskLevel) {
      case 'HIGH': return 'RISQUE ÉLEVÉ';
      case 'MEDIUM': return 'RISQUE MODÉRÉ';
      case 'LOW': return 'ATTENTION';
      default: return 'NORMAL';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 w-96 transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <Alert className={`border-2 shadow-lg ${getRiskColor()}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getRiskIcon()}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">ANOMALIE DÉTECTÉE</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    anomalyResult.riskLevel === 'HIGH' ? 'border-red-500 text-red-700' :
                    anomalyResult.riskLevel === 'MEDIUM' ? 'border-yellow-500 text-yellow-700' :
                    'border-orange-500 text-orange-700'
                  }`}
                >
                  {getRiskLabel()}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-gray-800">{anomalyData.materialName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <AlertDescription className="mt-3 space-y-3">
          {/* Message principal */}
          <div className="p-3 bg-white/70 rounded-md border">
            <p className="text-sm font-medium text-gray-800">{anomalyResult.message}</p>
            {anomalyResult.deviationPercentage > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 font-semibold">
                  +{anomalyResult.deviationPercentage}% au-dessus de la normale
                </span>
              </div>
            )}
          </div>

          {/* Action recommandée */}
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">ACTION RECOMMANDÉE:</p>
            <p className="text-sm text-blue-800">{anomalyResult.recommendedAction}</p>
          </div>

          {/* Statut email */}
          {anomalyResult.shouldSendAlert && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
              <Mail className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                {emailSent ? '✅ Email d\'alerte envoyé' : '📤 Envoi d\'email en cours...'}
              </span>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewDetails}
                className="flex-1 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Voir Détails
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleClose}
              className={`flex-1 text-xs ${
                anomalyResult.riskLevel === 'HIGH' ? 'bg-red-600 hover:bg-red-700' :
                anomalyResult.riskLevel === 'MEDIUM' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              Compris
            </Button>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Détecté le {new Date(anomalyData.timestamp).toLocaleString('fr-FR')}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}