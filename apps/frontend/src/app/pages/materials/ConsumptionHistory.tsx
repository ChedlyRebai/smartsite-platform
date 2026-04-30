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
  Clock, User, MapPin, FileText, Loader2
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

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (materialId) params.materialId = materialId;
      if (siteId) params.siteId = siteId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (typeFilter !== 'all') params.flowType = typeFilter; // Changé de 'type' à 'flowType'

      console.log('📤 Paramètres envoyés:', params);

      const { data } = await axios.get('/api/consumption-history', { params });
      
      console.log('📊 Réponse historique:', data);
      
      // Le service retourne { data: [...], pagination: {...} }
      if (data && data.data) {
        setEntries(data.data);
      } else if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error(error.response?.data?.message || 'Erreur chargement historique');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [materialId, siteId]);

  const handleExport = async () => {
    try {
      const params: any = {};
      if (materialId) params.materialId = materialId;
      if (siteId) params.siteId = siteId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (typeFilter !== 'all') params.flowType = typeFilter; // Changé de 'type' à 'flowType'

      const response = await axios.get('/api/consumption-history/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `historique_consommation_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export réussi!');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
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
    };
    
    const labels: Record<string, string> = {
      IN: 'Entrée',
      OUT: 'Sortie',
      ADJUSTMENT: 'Ajustement',
      TRANSFER: 'Transfert',
      RETURN: 'Retour',
      WASTE: 'Déchet',
      DAMAGE: 'Dommage',
      RESERVE: 'Réserve',
      DAILY_CONSUMPTION: 'Consommation',
    };
    
    return (
      <Badge className={styles[flowType] || 'bg-gray-100 text-gray-700'}>
        {labels[flowType] || flowType}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique de Consommation</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600">Recherche</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Matériau, site, utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md mt-1" 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="IN">Entrée</option>
                  <option value="OUT">Sortie</option>
                  <option value="ADJUSTMENT">Ajustement</option>
                  <option value="TRANSFER">Transfert</option>
                  <option value="RETURN">Retour</option>
                  <option value="WASTE">Déchet</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Date début</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Date fin</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
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
              <p>Aucun mouvement trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry._id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {getTypeIcon(entry.flowType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{entry.materialName}</span>
                        <span className="text-sm text-gray-500">({entry.materialCode})</span>
                        {getTypeBadge(entry.flowType)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {entry.siteName}
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.date || entry.createdAt)}
                        </span>
                      </div>
                      
                      {entry.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">{entry.notes}</p>
                      )}
                      
                      {entry.reason && (
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Raison:</span> {entry.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-2xl font-bold ${
                      entry.flowType === 'IN' || entry.flowType === 'RETURN' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {entry.flowType === 'IN' || entry.flowType === 'RETURN' ? '+' : '-'}{entry.quantity}
                    </div>
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
