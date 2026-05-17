import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Trash2, X, AlertTriangle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { incidentEvents } from './IncidentBadge';

interface Notification {
  id: string;
  type: 'resolved' | 'deleted' | 'created' | 'updated';
  message: string;
  description?: string;
  incidentId?: string;
  timestamp: number;
  read: boolean;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNew, setHasNew] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('incident-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setHasNew(parsed.some((n: Notification) => !n.read));
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('incident-notifications', JSON.stringify(notifications));
    setHasNew(notifications.some(n => !n.read));
  }, [notifications]);

  // Listen for events
  useEffect(() => {
    console.log('🔔 NotificationPanel: Starting event listeners');

    const unsubscribeUpdated = incidentEvents.on('updated', (data) => {
      console.log('🔔 NotificationPanel: Received updated event', data);
      addNotification({
        type: 'resolved',
        message: 'Incident traité',
        description: `L'incident a été marqué comme traité`,
        incidentId: data.incidentId,
      });
    });

    const unsubscribeDeleted = incidentEvents.on('deleted', (data) => {
      console.log('🔔 NotificationPanel: Received deleted event', data);
      addNotification({
        type: 'deleted',
        message: 'Incident supprimé',
        description: `L'incident a été supprimé`,
        incidentId: data.incidentId,
      });
    });

    const unsubscribeCreated = incidentEvents.on('created', (data) => {
      console.log('🔔 NotificationPanel: Received created event', data);
      addNotification({
        type: 'created',
        message: 'Nouvel incident',
        description: `Un nouvel incident a été créé`,
        incidentId: data.incidentId,
      });
    });

    // Polling mechanism for cross-page communication
    let lastCheck = Date.now();
    const pollInterval = setInterval(() => {
      const stored = localStorage.getItem('incident-last-action');
      if (stored) {
        try {
          const action = JSON.parse(stored);
          // Only process if it's newer than last check and not from this tab
          if (action.timestamp > lastCheck && action.tabId !== getTabId()) {
            console.log('🔔 NotificationPanel: Polling found new action', action);
            lastCheck = action.timestamp;

            if (action.type === 'resolved') {
              addNotification({
                type: 'resolved',
                message: 'Incident traité',
                description: `L'incident a été marqué comme traité`,
                incidentId: action.incidentId,
              });
            } else if (action.type === 'deleted') {
              addNotification({
                type: 'deleted',
                message: 'Incident supprimé',
                description: `L'incident a été supprimé`,
                incidentId: action.incidentId,
              });
            }
          }
        } catch (e) {
          console.error('Error polling notifications:', e);
        }
      }
    }, 1000); // Check every second

    return () => {
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeCreated();
      clearInterval(pollInterval);
    };
  }, []);

  // Generate unique tab ID
  const getTabId = () => {
    const win = window as any;
    if (!win.__tabId) {
      win.__tabId = Math.random().toString(36).substr(2, 9);
    }
    return win.__tabId;
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setHasNew(true);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasNew(false);
  };

  const clearAll = () => {
    setNotifications([]);
    setHasNew(false);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'deleted':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'created':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'resolved':
        return 'bg-green-50 border-green-200';
      case 'deleted':
        return 'bg-red-50 border-red-200';
      case 'created':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllAsRead();
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        {hasNew && unreadCount === 0 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            role="presentation"
            onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {notifications.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ({notifications.length})
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tout lire
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Vider
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucune notification</p>
                  <p className="text-xs mt-1">
                    Les notifications apparaissent ici quand des incidents sont traités ou supprimés depuis les pages Sites/Projets
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50' : ''
                        } ${getColor(notif.type)}`}
                      onClick={() => markAsRead(notif.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') markAsRead(notif.id); }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start gap-3">
                        {getIcon(notif.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium text-sm ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notif.message}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {notif.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notif.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTime(notif.timestamp)}
                            </span>
                            {!notif.read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationPanel;
