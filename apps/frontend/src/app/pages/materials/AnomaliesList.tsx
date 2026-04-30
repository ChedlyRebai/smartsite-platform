import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { AlertTriangle, Package, Calendar, TrendingUp, XCircle, CheckCircle } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import materialService from '../../../services/materialService';

interface Anomaly {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'overstock' | 'high_consumption';
  severity: 'critical' | 'high' | 'medium' | 'low';
  materialName: string;
  materialCode: string;
  message: string;
  value: number;
  threshold: number;
  date: Date;
  resolved?: boolean;
}

export default function AnomaliesList() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAnomalies();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadAnomalies, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnomalies = async () => {
    try {
      // Récupérer les alertes existantes
      const alerts = await materialService.getAlerts();
      
      // Récupérer tous les matériaux pour analyse supplémentaire
      const materials = await materialService.getMaterials({ limit: 100 });
      const materialList = Array.isArray(materials) ? materials : (materials as any).data || [];
      
      const newAnomalies: Anomaly[] = [];
      
      // Analyser chaque matériau
      for (const material of materialList) {
        // Anomalie: stock bas
        if (material.quantity <= material.reorderPoint && material.quantity > 0) {
          newAnomalies.push({
            id: `${material._id}-low`,
            type: 'low_stock',
            severity: 'high',
            materialName: material.name,
            materialCode: material.code,
            message: `Stock bas: ${material.quantity}/${material.reorderPoint} ${material.unit}`,
            value: material.quantity,
            threshold: material.reorderPoint,
            date: new Date(),
          });
        }
        
        // Anomalie: rupture de stock
        if (material.quantity === 0) {
          newAnomalies.push({
            id: `${material._id}-out`,
            type: 'out_of_stock',
            severity: 'critical',
            materialName: material.name,
            materialCode: material.code,
            message: `Rupture de stock! Commande urgente nécessaire.`,
            value: 0,
            threshold: material.reorderPoint,
            date: new Date(),
          });
        }
        
        // Anomalie: expiration proche
        if (material.expiryDate) {
          const daysToExpiry = Math.ceil((new Date(material.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysToExpiry <= 30 && daysToExpiry > 0) {
            newAnomalies.push({
              id: `${material._id}-exp`,
              type: 'expiring',
              severity: daysToExpiry <= 7 ? 'critical' : 'high',
              materialName: material.name,
              materialCode: material.code,
              message: `Expire dans ${daysToExpiry} jours (${new Date(material.expiryDate).toLocaleDateString()})`,
              value: daysToExpiry,
              threshold: 30,
              date: new Date(),
            });
          }
        }
        
        // Anomalie: surstock
        if (material.maximumStock && material.quantity > material.maximumStock * 1.2) {
          newAnomalies.push({
            id: `${material._id}-over`,
            type: 'overstock',
            severity: 'medium',
            materialName: material.name,
            materialCode: material.code,
            message: `Surstock: ${material.quantity} > ${material.maximumStock} ${material.unit}`,
            value: material.quantity,
            threshold: material.maximumStock,
            date: new Date(),
          });
        }
        
        // Anomalie: consommation élevée (basée sur le taux)
        if (material.consumptionRate && material.consumptionRate > 10) {
          newAnomalies.push({
            id: `${material._id}-high-cons`,
            type: 'high_consumption',
            severity: 'medium',
            materialName: material.name,
            materialCode: material.code,
            message: `Consommation élevée: ${material.consumptionRate} unités/heure`,
            value: material.consumptionRate,
            threshold: 10,
            date: new Date(),
          });
        }
      }
      
      setAnomalies(newAnomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }));
    } catch (error) {
      console.error('Error loading anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <Package className="h-4 w-4" />;
      case 'out_of_stock': return <AlertTriangle className="h-4 w-4" />;
      case 'expiring': return <Calendar className="h-4 w-4" />;
      case 'overstock': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'low_stock': return 'Stock bas';
      case 'out_of_stock': return 'Rupture';
      case 'expiring': return 'Expiration';
      case 'overstock': return 'Surstock';
      case 'high_consumption': return 'Consommation élevée';
      default: return 'Anomalie';
    }
  };

  const filteredAnomalies = filter === 'all' 
    ? anomalies 
    : anomalies.filter(a => a.type === filter);

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Anomalies & Alertes
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="secondary" className="bg-orange-500 text-white ml-1">
                {highCount} haute{highCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="all">Toutes</option>
              <option value="out_of_stock">Ruptures</option>
              <option value="low_stock">Stock bas</option>
              <option value="expiring">Expirations</option>
              <option value="overstock">Surstock</option>
              <option value="high_consumption">Consommation élevée</option>
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>Aucune anomalie détectée</p>
            <p className="text-sm">Tous les stocks sont dans les normes</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`p-3 rounded-lg border-l-4 ${getSeverityColor(anomaly.severity)}`}
                style={{ borderLeftColor: anomaly.severity === 'critical' ? '#ef4444' : anomaly.severity === 'high' ? '#f97316' : '#eab308' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getTypeIcon(anomaly.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{anomaly.materialName}</p>
                        <span className="text-xs text-gray-500">({anomaly.materialCode})</span>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(anomaly.type)}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{anomaly.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(anomaly.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium uppercase">{anomaly.severity}</span>
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