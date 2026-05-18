"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import { 
  Calendar, Download, RefreshCw, Search, Filter, 
  TrendingUp, TrendingDown, AlertTriangle, Package,
  Clock, MapPin, FileText, Loader2, Upload
} from "lucide-react";
import axios from "axios";

interface ConsumptionEntry {
  _id: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialCategory: string;
  materialUnit: string;
  siteId: string;
  siteName: string;
  quantity: number;
  flowType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'WASTE' | 'DAMAGE' | 'RESERVE' | 'DAILY_CONSUMPTION';
  reason?: string;
  recordedBy?: string;
  notes?: string;
  date: string;
  createdAt: string;
  stockBefore?: number;
  stockAfter?: number;
  anomalyType?: string;
  anomalySeverity?: string;
}

interface ConsumptionHistoryProps {
  materialId?: string;
  siteId?: string;
}

export default function ConsumptionHistory({ materialId, siteId }: ConsumptionHistoryProps) {
  const [entries, setEntries] = useState<ConsumptionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (materialId) params.materialId = materialId;
      if (siteId) params.siteId = siteId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (typeFilter !== 'all') params.flowType = typeFilter;

      const { data } = await axios.get('/api/consumption-history', { params });
      
      // The service returns { data: [...], pagination: {...} }
      if (data && data.data) {
        setEntries(data.data);
      } else if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error(error.response?.data?.message || 'Error loading history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [materialId, siteId]);

  // Export history as Excel
  const handleExport = async () => {
    try {
      const params: any = {};
      if (materialId) params.materialId = materialId;
      if (siteId) params.siteId = siteId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (typeFilter !== 'all') params.flowType = typeFilter;

      // ✅ FIX: Use materials controller endpoint instead of consumption-history
      const response = await axios.get('/api/materials/consumption-history/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `consumption_history_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export successful!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Error during export');
    }
  };

  // Upload CSV history file
  const handleUploadHistory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload to materials import endpoint
        const response = await axios.post('/api/materials/import/excel', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data?.success || response.data?.imported > 0) {
          toast.success(`✅ Import successful! ${response.data.imported || 0} records imported`);
          // Sync after import
          await handleSync();
        } else {
          toast.error(response.data?.message || 'Import failed');
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.message || 'Error uploading file');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Sync history data
  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await axios.post('/api/consumption-history/sync');
      if (data.success !== false) {
        toast.success(`✅ Sync complete: ${data.synced || 0} entries synchronized`);
        loadHistory();
      } else {
        toast.error('Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.response?.data?.message || 'Error during sync');
    } finally {
      setSyncing(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.materialCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.siteName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getTypeIcon = (flowType: string) => {
    switch (flowType) {
      case 'IN': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'OUT': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'ADJUSTMENT': return <Package className="h-4 w-4 text-blue-500" />;
      case 'TRANSFER': return <MapPin className="h-4 w-4 text-purple-500" />;
      case 'RETURN': return <TrendingUp className="h-4 w-4 text-cyan-500" />;
      case 'WASTE': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'DAMAGE': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'DAILY_CONSUMPTION': return <TrendingDown className="h-4 w-4 text-orange-400" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (flowType: string) => {
    const styles: Record<string, string> = {
      IN: 'bg-green-100 text-green-700',
      OUT: 'bg-red-100 text-red-700',
      ADJUSTMENT: 'bg-blue-100 text-blue-700',
      TRANSFER: 'bg-purple-100 text-purple-700',
      RETURN: 'bg-cyan-100 text-cyan-700',
      WASTE: 'bg-orange-100 text-orange-700',
      DAMAGE: 'bg-red-100 text-red-700',
      DAILY_CONSUMPTION: 'bg-orange-100 text-orange-600',
    };
    
    const labels: Record<string, string> = {
      IN: '↑ In',
      OUT: '↓ Out',
      ADJUSTMENT: 'Adjustment',
      TRANSFER: 'Transfer',
      RETURN: '↑ Return',
      WASTE: 'Waste',
      DAMAGE: 'Damage',
      RESERVE: 'Reserve',
      DAILY_CONSUMPTION: 'Consumption',
    };
    
    return (
      <Badge className={styles[flowType] || 'bg-gray-100 text-gray-700'}>
        {labels[flowType] || flowType}
      </Badge>
    );
  };

  const getAnomalyBadge = (anomalyType?: string, anomalySeverity?: string) => {
    if (!anomalyType || anomalyType === 'NONE') return null;
    const severityColors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-700 border border-red-300',
      WARNING: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      LOW: 'bg-orange-100 text-orange-700 border border-orange-300',
    };
    const typeLabels: Record<string, string> = {
      VOL: '🚨 Theft Risk',
      PROBLEME: '⚠️ Problem',
      NORMAL: '✅ Normal',
    };
    return (
      <Badge className={severityColors[anomalySeverity || 'LOW'] || 'bg-gray-100 text-gray-700'}>
        {typeLabels[anomalyType] || anomalyType}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Summary stats
  const totalIn = filteredEntries.filter(e => e.flowType === 'IN' || e.flowType === 'RETURN').reduce((s, e) => s + (e.quantity || 0), 0);
  const totalOut = filteredEntries.filter(e => e.flowType === 'OUT' || e.flowType === 'DAMAGE' || e.flowType === 'DAILY_CONSUMPTION').reduce((s, e) => s + (e.quantity || 0), 0);
  const anomalyCount = filteredEntries.filter(e => e.anomalyType && e.anomalyType !== 'NONE').length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {filteredEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">+{totalIn}</p>
              <p className="text-xs text-green-700">Total Inputs</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">-{totalOut}</p>
              <p className="text-xs text-red-700">Total Outputs</p>
            </CardContent>
          </Card>
          <Card className={`border ${anomalyCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${anomalyCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>{anomalyCount}</p>
              <p className="text-xs text-gray-600">Anomalies</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Consumption History
              {filteredEntries.length > 0 && (
                <Badge variant="secondary">{filteredEntries.length} entries</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUploadHistory}
                disabled={uploading}
                title="Upload CSV/Excel history file"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                Upload
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync}
                disabled={syncing}
                title="Sync history from flow logs"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Sync
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredEntries.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="ch-search" className="text-sm text-gray-600">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="ch-search"
                    placeholder="Material, site..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="ch-type" className="text-sm text-gray-600">Type</label>
                <select 
                  id="ch-type"
                  className="w-full px-3 py-2 border rounded-md mt-1" 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="IN">↑ In</option>
                  <option value="OUT">↓ Out</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="RETURN">Return</option>
                  <option value="WASTE">Waste</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="DAILY_CONSUMPTION">Consumption</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="ch-start-date" className="text-sm text-gray-600">Start date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="ch-end-date" className="text-sm text-gray-600">End date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {showFilters && (dateFrom || dateTo || typeFilter !== 'all' || searchTerm) && (
            <div className="mt-2 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { loadHistory(); }}
                className="text-blue-600"
              >
                Apply Filters
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No movements found</p>
              <p className="text-sm mt-1">Record stock movements (IN/OUT) to see history here</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Sync from flow logs
                </Button>
                <Button variant="outline" size="sm" onClick={handleUploadHistory} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  Upload history file
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry._id} 
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                    entry.anomalyType && entry.anomalyType !== 'NONE' ? 'border-orange-200 bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getTypeIcon(entry.flowType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">{entry.materialName}</span>
                        {entry.materialCode && (
                          <span className="text-xs text-gray-500">({entry.materialCode})</span>
                        )}
                        {getTypeBadge(entry.flowType)}
                        {getAnomalyBadge(entry.anomalyType, entry.anomalySeverity)}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        {entry.siteName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {entry.siteName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.date || entry.createdAt)}
                        </span>
                        {entry.materialUnit && (
                          <span className="text-gray-400">Unit: {entry.materialUnit}</span>
                        )}
                      </div>
                      
                      {entry.reason && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Reason:</span> {entry.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right ml-3">
                    <div className={`text-xl font-bold ${
                      entry.flowType === 'IN' || entry.flowType === 'RETURN' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {entry.flowType === 'IN' || entry.flowType === 'RETURN' ? '+' : '-'}{entry.quantity}
                    </div>
                    {(entry.stockBefore !== undefined && entry.stockAfter !== undefined) && (
                      <div className="text-xs text-gray-400">
                        {entry.stockBefore} → {entry.stockAfter}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
