import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface IncidentNotification {
  event: 'incident:assigned' | 'incident:resolved';
  incidentId: string;
  incidentName: string;
  description?: string;
  priority?: string;
  severity?: string;
  incidentType?: string;
  assignedToCin?: string;
  timestamp: string;
}

export function useIncidentWebSocket(userCin: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<IncidentNotification[]>([]);

  // Connect to Socket.io
  useEffect(() => {
    if (!userCin) return;

    console.log('🔌 Connecting to incident Socket.io...');

    const ws = io('http://localhost:3004', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    ws.on('connect', () => {
      console.log('✅ Socket.io connected');
      setIsConnected(true);

      // Subscribe to incident notifications
      ws.emit('subscribe', { userCin });
    });

    ws.on('subscribed', (data) => {
      console.log('📌 Subscribed to notifications:', data);
    });

    ws.on('incident:assigned', (data) => {
      console.log('🚨 New incident assigned!', data);
      setNotifications((prev) => [
        ...prev,
        {
          event: 'incident:assigned',
          incidentId: data.incidentId,
          incidentName: data.incidentName,
          description: data.description,
          priority: data.priority,
          severity: data.severity,
          incidentType: data.type,
          assignedToCin: data.assignedToCin,
          timestamp: data.timestamp,
        },
      ]);

      // Play sound
      playNotificationSound();

      // Show toast
      toast.error(`⚠️ Incident assigné: ${data.incidentName}`, {
        duration: 10000,
        action: {
          label: 'Voir',
          onClick: () => {},
        },
      });
    });

    ws.on('incident:resolved', (data) => {
      console.log('✅ Incident resolved', data);
      setNotifications((prev) => [
        ...prev,
        {
          event: 'incident:resolved',
          incidentId: data.incidentId,
          incidentName: data.incidentName,
          timestamp: data.timestamp,
        },
      ]);
      toast.success(`✅ Incident résolu: ${data.incidentName}`);
    });

    ws.on('error', (error) => {
      console.error('❌ Socket.io error:', error);
      toast.error('Erreur de connexion WebSocket');
      setIsConnected(false);
    });

    ws.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
      setIsConnected(false);
    });

    setSocket(ws);

    return () => {
      if (ws) {
        ws.disconnect();
      }
    };
  }, [userCin]);

  const playNotificationSound = useCallback(() => {
    try {
      // Create an audio context and play a beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency and duration
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      // Fade in
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);

      // Fade out
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      console.log('🔊 Notification sound played');
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    isConnected,
    notifications,
    clearNotifications,
    playNotificationSound,
  };
}
