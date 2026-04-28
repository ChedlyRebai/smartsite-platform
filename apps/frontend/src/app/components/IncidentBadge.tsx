import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, Trash2, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';

// Generate unique tab ID for cross-tab communication
const getTabId = () => {
  const win = window as any;
  if (!win.__tabId) {
    win.__tabId = Math.random().toString(36).substr(2, 9);
  }
  return win.__tabId;
};

// Event emitter for cross-page communication
export const incidentEvents = {
  emit: (event: string, data?: any) => {
    console.log('📤 Emitting incident event:', event, data);

    // Emit for same-page communication
    window.dispatchEvent(new CustomEvent('incident:' + event, { detail: data }));

    // Emit for cross-tab communication via localStorage
    localStorage.setItem('incident-event', JSON.stringify({ event, data, timestamp: Date.now() }));

    // Also write to incident-last-action for polling mechanism
    localStorage.setItem('incident-last-action', JSON.stringify({
      type: event,
      ...data,
      timestamp: Date.now(),
      tabId: getTabId()
    }));

    // Use BroadcastChannel if available (better cross-tab support)
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('incidents');
      bc.postMessage({ event, data, timestamp: Date.now() });
      bc.close();
    }
  },
  on: (event: string, callback: (data: any) => void) => {
    // Listen for CustomEvents (same-page)
    const handler = (e: any) => callback(e.detail);
    window.addEventListener('incident:' + event, handler);

    // Listen for localStorage changes (cross-tab)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'incident-event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.event === event) {
            callback(parsed.data);
          }
        } catch (err) {
          console.error('Error parsing incident event:', err);
        }
      }
    };
    window.addEventListener('storage', storageHandler);

    // Listen for BroadcastChannel messages (cross-tab, modern browsers)
    let bcHandler: ((e: MessageEvent) => void) | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('incidents');
      bcHandler = (e: MessageEvent) => {
        if (e.data.event === event) {
          callback(e.data.data);
        }
      };
      bc.onmessage = bcHandler;
    }

    return () => {
      window.removeEventListener('incident:' + event, handler);
      window.removeEventListener('storage', storageHandler);
      if (typeof BroadcastChannel !== 'undefined' && bcHandler) {
        const bc = new BroadcastChannel('incidents');
        bc.close();
      }
    };
  }
};

interface Incident {
  _id: string;
  id?: string;
  title?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdAt: string;
  siteId?: string;
  projectId?: string;
}

interface IncidentBadgeProps {
  siteId?: string;
  projectId?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const incidentsApi = axios.create({
  baseURL: 'http://localhost:3003',
  timeout: 5000,
});

const getAuthToken = (): string | null => {
  const directToken = localStorage.getItem('access_token');
  if (directToken) return directToken;
  const persisted = localStorage.getItem('smartsite-auth');
  if (!persisted) return null;
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
};

incidentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const statusFilters = [
  { value: 'all', label: 'All', color: 'bg-gray-100 text-gray-800' },
  { value: 'open', label: 'Open', color: 'bg-red-100 text-red-800' },
  { value: 'investigating', label: 'Investigating', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600' },
];

export function IncidentBadge({ siteId, projectId, showCount = true, size = 'md' }: IncidentBadgeProps) {
  const [count, setCount] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debug: always log what we receive
  console.log('🔍 IncidentBadge props:', { siteId, projectId });

  const sizeClasses = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-8 w-8 text-base',
  };

  useEffect(() => {
    fetchCount();
  }, [siteId, projectId]);

  const fetchCount = async () => {
    try {
      setError(null);
      let endpoint = '';
      if (siteId) {
        endpoint = `/incidents/count-by-site/${siteId}`;
      } else if (projectId) {
        endpoint = `/incidents/count-by-project/${projectId}`;
      } else {
        console.log('⚠️ IncidentBadge: No siteId or projectId provided');
        return;
      }

      console.log('🔍 IncidentBadge fetching:', endpoint);
      const response = await incidentsApi.get(endpoint);
      console.log('🔍 IncidentBadge response:', response.data);
      setCount(response.data.count || 0);
    } catch (err: any) {
      console.error('❌ Error fetching incident count:', err);
      console.error('   URL:', err.config?.url);
      console.error('   Status:', err.response?.status);
      console.error('   Data:', err.response?.data);
      setError(err.message);
      setCount(0);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      if (siteId) {
        endpoint = `/incidents/by-site/${siteId}`;
      } else if (projectId) {
        endpoint = `/incidents/by-project/${projectId}`;
      } else {
        return;
      }

      const response = await incidentsApi.get(endpoint);
      const data = Array.isArray(response.data) ? response.data : [];
      setIncidents(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      setActionLoading(incidentId);
      await incidentsApi.put(`/incidents/${incidentId}`, {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });

      // Notify other pages
      incidentEvents.emit('updated', { incidentId, status: 'resolved' });

      // Refresh local list
      setIncidents(prev => prev.map(inc =>
        inc._id === incidentId || inc.id === incidentId
          ? { ...inc, status: 'resolved' }
          : inc
      ));

      // Refresh count
      await fetchCount();

      toast.success('Incident marqué comme traité');
    } catch (error) {
      console.error('Error resolving incident:', error);
      toast.error('Erreur lors de la résolution');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (incidentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet incident ?')) {
      return;
    }

    try {
      setActionLoading(incidentId);
      await incidentsApi.delete(`/incidents/${incidentId}`);

      // Notify other pages
      incidentEvents.emit('deleted', { incidentId });

      // Remove from local list
      setIncidents(prev => prev.filter(inc =>
        inc._id !== incidentId && inc.id !== incidentId
      ));

      // Refresh count
      await fetchCount();

      toast.success('Incident supprimé');
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (statusFilter === 'all') return true;
    return inc.status === statusFilter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'safety':
        return '🚨 Safety';
      case 'quality':
        return '⚡ Quality';
      case 'delay':
        return '⏱️ Delay';
      default:
        return '📋 Other';
    }
  };

  // DEBUG MODE: Always show badge for testing
  const debugMode = true;

  if (!debugMode && count === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={fetchIncidents}
        className={`relative inline-flex items-center justify-center rounded-full ${count > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 hover:bg-gray-500'} text-white font-bold transition-all hover:scale-110 ${sizeClasses[size]}`}
        title={count > 0 ? `${count} incident${count > 1 ? 's' : ''}` : error || 'No incidents'}
      >
        <AlertTriangle className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
        {showCount && (
          <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${count > 0 ? 'bg-white text-red-600' : 'bg-gray-200 text-gray-500'} text-xs font-bold`}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Incidents ({incidents.length})
              {siteId && <span className="text-sm font-normal text-gray-500">- Site</span>}
              {projectId && <span className="text-sm font-normal text-gray-500">- Project</span>}
            </DialogTitle>
          </DialogHeader>

          {/* Status Filter */}
          <div className="flex items-center gap-2 mt-4 mb-4 overflow-x-auto">
            <Filter className="h-4 w-4 text-gray-500 shrink-0" />
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === filter.value
                  ? filter.color + ' ring-2 ring-offset-1 ring-blue-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {filter.label}
                <span className="ml-1 text-xs opacity-70">
                  ({filter.value === 'all'
                    ? incidents.length
                    : incidents.filter(i => i.status === filter.value).length
                  })
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {incidents.length === 0
                  ? 'Aucun incident trouvé'
                  : 'Aucun incident dans cette catégorie'
                }
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <div
                  key={incident._id || incident.id}
                  className={`border rounded-lg p-4 transition-colors ${incident.status === 'resolved' ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-600">{getTypeLabel(incident.type)}</span>
                        <Badge variant={incident.status === 'open' ? 'destructive' : incident.status === 'resolved' ? 'default' : 'secondary'}>
                          {incident.status === 'open' ? 'En cours' :
                            incident.status === 'resolved' ? 'Traité' :
                              incident.status === 'investigating' ? 'Investigation' :
                                incident.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{incident.title || incident.type}</h4>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{incident.description}</p>
                      <p className="text-gray-400 text-xs">
                        Créé le: {new Date(incident.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {incident.status !== 'resolved' && incident.status !== 'closed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleResolve(incident._id || incident.id || '')}
                          disabled={actionLoading === (incident._id || incident.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {actionLoading === (incident._id || incident.id) ? '...' : 'Traité'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(incident._id || incident.id || '')}
                        disabled={actionLoading === (incident._id || incident.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {actionLoading === (incident._id || incident.id) ? '...' : 'Suppr'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default IncidentBadge;
