import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Calendar,
  Package,
  MapPin,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import materialFlowService, { MaterialFlow, FlowType, AnomalyType } from '../../../services/materialFlowService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MaterialFlowLogProps {
  materialId?: string;
  siteId?: string;
}

export default function MaterialFlowLog({ materialId, siteId }: MaterialFlowLogProps) {
  const [flows, setFlows] = useState<MaterialFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<MaterialFlow[]>([]);
  const [filter, setFilter] = useState<'all' | 'IN' | 'OUT' | 'anomaly'>('all');
  const [stats, setStats] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadFlows();
    loadAnomalies();
  }, [materialId, siteId, startDate, endDate]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const data = await materialFlowService.getEnrichedFlows({
        materialId,
        siteId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: 200,
      });
      setFlows(data.data);

      if (materialId && siteId) {
        const statsData = await materialFlowService.getFlowStatistics(materialId, siteId);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
      toast.error('Error loading movements');
    } finally {
      setLoading(false);
    }
  };

  const loadAnomalies = async () => {
    try {
      const data = await materialFlowService.getAnomalies();
      setAnomalies(data);
    } catch (error) {
      console.error('Error loading anomalies:', error);
    }
  };

  const getFilteredFlows = () => {
    if (filter === 'anomaly') {
      return flows.filter(f => f.anomalyDetected !== AnomalyType.NONE);
    }
    if (filter === 'IN') return flows.filter(f => f.type === FlowType.IN || f.type === FlowType.RETURN);
    if (filter === 'OUT') return flows.filter(f => f.type === FlowType.OUT || f.type === FlowType.DAMAGE);
    return flows;
  };

  // Compute totals from current flows
  const totalIn = flows.filter(f => f.type === FlowType.IN || f.type === FlowType.RETURN).reduce((s, f) => s + f.quantity, 0);
  const totalOut = flows.filter(f => f.type === FlowType.OUT || f.type === FlowType.DAMAGE).reduce((s, f) => s + f.quantity, 0);
  const flowAnomalies = flows.filter(f => f.anomalyDetected !== AnomalyType.NONE);
  const imbalanceRatio = totalIn > 0 ? totalOut / totalIn : 0;
  const hasImbalanceAnomaly = totalIn > 0 && imbalanceRatio > 1.5;

  const getFlowIcon = (type: FlowType) => {
    switch (type) {
      case FlowType.IN:
      case FlowType.RETURN:
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case FlowType.OUT:
      case FlowType.DAMAGE:
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  const getFlowColor = (type: FlowType) => {
    switch (type) {
      case FlowType.IN:
      case FlowType.RETURN:
        return 'text-green-600';
      case FlowType.OUT:
      case FlowType.DAMAGE:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFlowSign = (type: FlowType) => {
    if (type === FlowType.IN || type === FlowType.RETURN) return '+';
    if (type === FlowType.OUT || type === FlowType.DAMAGE) return '-';
    return '';
  };

  const getAnomalyBadge = (type: AnomalyType) => {
    if (type === AnomalyType.NONE) return null;
    const config: Record<string, { label: string; color: string }> = {
      [AnomalyType.EXCESSIVE_OUT]: { label: '🚨 Excessive Output', color: 'bg-red-100 text-red-700 border border-red-300' },
      [AnomalyType.EXCESSIVE_IN]: { label: '⚠️ Excessive Input', color: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
      [AnomalyType.BELOW_SAFETY_STOCK]: { label: '⚠️ Critical Stock', color: 'bg-orange-100 text-orange-700 border border-orange-300' },
      [AnomalyType.UNEXPECTED_MOVEMENT]: { label: '❓ Unexpected', color: 'bg-purple-100 text-purple-700 border border-purple-300' },
    };
    const cfg = config[type];
    if (!cfg) return null;
    return <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>;
  };

  const getTypeLabel = (type: FlowType) => {
    const labels: Record<string, string> = {
      IN: 'Entry', OUT: 'Exit', DAMAGE: 'Damaged',
      RESERVE: 'Reserved', RETURN: 'Return', ADJUSTMENT: 'Adjustment',
    };
    return labels[type] || type;
  };

  const filteredFlows = getFilteredFlows();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Material Flow Log
        </h2>
        <Button variant="outline" size="sm" onClick={() => { loadFlows(); loadAnomalies(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* ===== SUMMARY STATS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <p className="text-xs text-green-700 font-medium">Total Entries</p>
            </div>
            <p className="text-3xl font-bold text-green-600">+{totalIn}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <p className="text-xs text-red-700 font-medium">Total Exits</p>
            </div>
            <p className="text-3xl font-bold text-red-600">-{totalOut}</p>
          </CardContent>
        </Card>
        <Card className={`border ${flowAnomalies.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className={`h-4 w-4 ${flowAnomalies.length > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              <p className="text-xs text-gray-600 font-medium">Anomalies</p>
            </div>
            <p className={`text-3xl font-bold ${flowAnomalies.length > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {flowAnomalies.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-blue-700 font-medium">Total Logs</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{flows.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== IMBALANCE ANOMALY ALERT ===== */}
      {hasImbalanceAnomaly && (
        <Card className="border-2 border-red-400 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">🚨 Flow Imbalance Detected — Possible Theft or Waste!</p>
                <p className="text-sm text-red-700 mt-1">
                  Exits ({totalOut}) are <strong>{(imbalanceRatio * 100 - 100).toFixed(0)}% higher</strong> than entries ({totalIn}).
                  This significant difference may indicate theft, waste, or unrecorded movements.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Recommended: Verify all stock movements and conduct a physical inventory count.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== DATE FILTERS ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label htmlFor="flow-start-date" className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <Input
                id="flow-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label htmlFor="flow-end-date" className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <Input
                id="flow-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setStartDate(''); setEndDate(''); }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== FILTER BUTTONS ===== */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({flows.length})
        </Button>
        <Button
          variant={filter === 'IN' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'IN' ? 'bg-green-600 hover:bg-green-700' : ''}
          onClick={() => setFilter('IN')}
        >
          <ArrowDownCircle className="h-4 w-4 mr-1" />
          Entries ({flows.filter(f => f.type === FlowType.IN || f.type === FlowType.RETURN).length})
        </Button>
        <Button
          variant={filter === 'OUT' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'OUT' ? 'bg-red-600 hover:bg-red-700' : ''}
          onClick={() => setFilter('OUT')}
        >
          <ArrowUpCircle className="h-4 w-4 mr-1" />
          Exits ({flows.filter(f => f.type === FlowType.OUT || f.type === FlowType.DAMAGE).length})
        </Button>
        <Button
          variant={filter === 'anomaly' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'anomaly' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          onClick={() => setFilter('anomaly')}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Anomalies ({flowAnomalies.length})
        </Button>
      </div>

      {/* ===== FLOW LIST ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Movement Log
            {filter !== 'all' && (
              <Badge variant="secondary">{filteredFlows.length} results</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500 text-sm">Loading movements...</p>
            </div>
          ) : filteredFlows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No movements recorded</p>
              <p className="text-sm mt-1">
                {filter === 'anomaly'
                  ? 'No anomalies detected in current period'
                  : 'Record stock movements (IN/OUT) to see them here'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFlows.map((flow) => (
                <div
                  key={flow._id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    flow.anomalyDetected !== AnomalyType.NONE
                      ? 'bg-red-50 border-red-200'
                      : 'hover:bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFlowIcon(flow.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${getFlowColor(flow.type)}`}>
                          {getFlowSign(flow.type)}{flow.quantity} units
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(flow.type)}
                        </Badge>
                        {getAnomalyBadge(flow.anomalyDetected)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(flow.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </span>
                        {(flow as any).materialName && (
                          <span className="text-gray-400">
                            • {(flow as any).materialName}
                            {(flow as any).materialCode && ` (${(flow as any).materialCode})`}
                          </span>
                        )}
                        {(flow as any).siteName && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <MapPin className="h-3 w-3" />
                            {(flow as any).siteName}
                          </span>
                        )}
                        {flow.reason && (
                          <span className="text-gray-400">• {flow.reason}</span>
                        )}
                      </div>
                      {flow.anomalyMessage && (
                        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {flow.anomalyMessage}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    {flow.previousStock !== undefined && flow.newStock !== undefined && (
                      <div className="text-xs text-gray-500">
                        <span>{flow.previousStock}</span>
                        <span className="mx-1">→</span>
                        <span className={`font-medium ${flow.newStock < flow.previousStock ? 'text-red-600' : 'text-green-600'}`}>
                          {flow.newStock}
                        </span>
                      </div>
                    )}
                    {(flow as any).userName && (
                      <div className="text-xs text-gray-400 mt-0.5">{(flow as any).userName}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== UNRESOLVED ANOMALIES SUMMARY ===== */}
      {anomalies.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700 text-base">
              <AlertTriangle className="h-5 w-5" />
              Unresolved Anomalies ({anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((anomaly) => (
                <div key={anomaly._id} className="flex items-center justify-between p-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <span className="font-medium text-sm">{(anomaly as any).materialName || 'Material'}</span>
                      {(anomaly as any).siteName && (
                        <span className="text-xs text-gray-400 ml-2">• {(anomaly as any).siteName}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-red-600 max-w-[200px] truncate">
                    {anomaly.anomalyMessage || anomaly.anomalyDetected}
                  </span>
                </div>
              ))}
              {anomalies.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  +{anomalies.length - 5} more anomalies
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
