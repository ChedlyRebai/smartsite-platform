"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { toast } from "sonner";
import { 
  Send, Mic, Paperclip, MapPin, Truck, ArrowLeft, 
  MessageCircle, Navigation, Clock, CheckCircle, 
  Loader2, FileText, Play, Pause, Download, 
  Phone, Video, Camera, X, MicOff, PhoneOff, Wallet, CreditCard, Euro
} from "lucide-react";
import chatService, { ChatMessage } from "../../../services/chatService";
import messageAnalysisService, { MessageAnalysisResult } from "../../../services/messageAnalysisService";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import orderService from "../../../services/orderService";
import PaymentDialog from "./PaymentDialog";
import EmojiPicker from "../../../components/chat/EmojiPicker";
import MessageAnalysisDisplay from "../../../components/chat/MessageAnalysisDisplay";
import MessageSuggestion from "../../../components/chat/MessageSuggestion";
import { Socket } from "socket.io-client";

// Initialisation des icônes Leaflet
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const truckIcon = L.icon({
  iconUrl: "/truck.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

const supplierIconMap = L.icon({
  iconUrl: "/warehouse.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const siteIconMap = L.icon({
  iconUrl: "/construction-site.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

function MapUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 12);
    }
  }, [position, map]);
  return null;
}

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  materialName: string;
  supplierName: string;
  siteName: string;
  supplierCoordinates?: { lat: number; lng: number };
  siteCoordinates?: { lat: number; lng: number };
  currentUser: { id: string; name: string; role: string };
}

const MessageMedia = ({ type, metadata }: { type: string; metadata?: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (type === 'image' && (metadata?.fileUrl || metadata?.file)) {
    const imageSrc = metadata?.fileUrl || metadata?.file;
    return (
      <div className="mt-2">
        <img 
          src={imageSrc} 
          alt={metadata.fileName || "Image"} 
          className="max-w-[200px] max-h-[150px] rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => window.open(imageSrc, '_blank')}
        />
        <p className="text-xs mt-1 text-gray-500">{metadata.fileName}</p>
      </div>
    );
  }

  if (type === 'voice' && (metadata?.audioUrl || metadata?.fileUrl)) {
    const audioSrc = metadata?.audioUrl || metadata?.fileUrl;
    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div className="mt-2 flex items-center gap-2 bg-gray-100 rounded-lg p-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <audio 
          ref={audioRef} 
          src={audioSrc}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        <div className="flex-1">
          <div className="h-1 bg-gray-300 rounded-full">
            <div className="w-0 h-full bg-blue-500 rounded-full" />
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {metadata.duration ? `${metadata.duration}s` : 'Message vocal'}
        </span>
      </div>
    );
  }

  if (type === 'file' && (metadata?.fileUrl || metadata?.file)) {
    const fileSrc = metadata?.fileUrl || metadata?.file;
    return (
      <div className="mt-2 flex items-center gap-2 bg-gray-100 rounded-lg p-2">
        <FileText className="h-4 w-4 text-gray-500" />
        <span className="text-sm truncate max-w-[150px]">{metadata.fileName}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => window.open(fileSrc, '_blank')}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return null;
};

export default function ChatDialog({
  open,
  onClose,
  orderId,
  materialName,
  supplierName,
  siteName,
  supplierCoordinates,
  siteCoordinates,
  currentUser,
}: ChatDialogProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "tracking">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState<"pending" | "in_transit" | "delivered">("pending");
  const [truckPosition, setTruckPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [orderNumber, setOrderNumber] = useState("");
  const [hasPaymentBeenProcessed, setHasPaymentBeenProcessed] = useState(false);
  
  // Call/Video state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ from: string; video: boolean } | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'connected'>('idle');
  
  // AI Analysis state
  const [currentAnalysis, setCurrentAnalysis] = useState<MessageAnalysisResult | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // WebSocket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const deliveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationStartTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const autoStartRef = useRef<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  // Calculer la distance et la durée estimée
  useEffect(() => {
    if (supplierCoordinates && siteCoordinates) {
      const dist = calculateDistance(
        siteCoordinates.lat,
        siteCoordinates.lng,
        supplierCoordinates.lat,
        supplierCoordinates.lng
      );
      setDistance(dist);
      const avgSpeedKmH = 30;
      const estimatedMinutes = Math.max(1, Math.round((dist / avgSpeedKmH) * 60));
      setEstimatedDuration(estimatedMinutes);
      setRemainingTime(estimatedMinutes);
    }
  }, [supplierCoordinates, siteCoordinates]);

  // Initialiser WebSocket et charger les données
  useEffect(() => {
    if (open && orderId && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeChat();
    }
    
    return () => {
      if (!open) {
        cleanupChat();
      }
    };
  }, [open, orderId]);

  const initializeChat = async () => {
    try {
      // Initialize WebSocket
      const socketInstance = chatService.initializeSocket();
      setSocket(socketInstance);

      // Setup WebSocket event listeners
      setupSocketListeners(socketInstance);

      // Join chat room
      socketInstance.emit('joinRoom', {
        orderId,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
      });

      // Load initial data
      await Promise.all([
        loadMessages(true),
        loadOrderStatus(),
      ]);

      // Load payment info if needed
      if (deliveryStatus === 'delivered' && !hasPaymentBeenProcessed) {
        await loadOrderPaymentInfo();
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Erreur de connexion au chat');
    }
  };

  const setupSocketListeners = (socketInstance: Socket) => {
    socketInstance.on('connect', () => {
      console.log('✅ Chat connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Chat disconnected');
      setIsConnected(false);
    });

    socketInstance.on('newMessage', (message: ChatMessage) => {
      console.log('📨 New message received:', message);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setLastMessageTimestamp(message.createdAt);
    });

    socketInstance.on('messageAnalysis', (data: { originalMessage: string; analysis: MessageAnalysisResult }) => {
      console.log('🤖 Message analysis received:', data.analysis);
      // This is handled in the send message flow
    });

    socketInstance.on('userJoined', (data: any) => {
      console.log('👤 User joined:', data.userName);
    });

    socketInstance.on('userLeft', (data: any) => {
      console.log('👋 User left:', data.userName);
    });

    socketInstance.on('reconnect', () => {
      console.log('🔄 Chat reconnected, syncing messages...');
      loadMessages(false); // Don't show loading on reconnect
    });
  };

  const cleanupChat = () => {
    hasInitializedRef.current = false;
    
    if (socket) {
      socket.emit('leaveRoom', { orderId, userId: currentUser.id });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newMessage');
      socket.off('messageAnalysis');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('reconnect');
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (deliveryTimerRef.current) {
      clearInterval(deliveryTimerRef.current);
      deliveryTimerRef.current = null;
    }
    
    stopCall();
    stopRingtone();
  };

  // Charger les informations de paiement de la commande
  useEffect(() => {
    if (orderId && deliveryStatus === 'delivered' && !hasPaymentBeenProcessed) {
      loadOrderPaymentInfo();
    }
  }, [orderId, deliveryStatus]);

  const loadOrderPaymentInfo = async () => {
    try {
      const order = await orderService.getOrderById(orderId);
      setOrderNumber(order.orderNumber || `ORD-${orderId.slice(-6)}`);
      
      // Calculer le montant (à adapter selon votre logique)
      const amount = await calculateOrderAmount(order);
      setPaymentAmount(amount);
      
      // Vérifier si déjà payé
      const paymentStatus = await orderService.getPaymentStatus(orderId);
      if (paymentStatus?.hasPayment && paymentStatus?.status === 'completed') {
        setHasPaymentBeenProcessed(true);
      }
    } catch (error) {
      console.error("Error loading payment info:", error);
      setPaymentAmount(250); // Montant par défaut
    }
  };

  const calculateOrderAmount = async (order: any): Promise<number> => {
    try {
      // Appel API pour récupérer le prix du matériau
      const response = await fetch(`/api/materials/${order.materialId}`);
      const material = await response.json();
      const unitPrice = material.unitPrice || material.price || 100;
      return Math.round(unitPrice * order.quantity * 100) / 100;
    } catch (error) {
      console.error("Error calculating amount:", error);
      return order.quantity * 100;
    }
  };

  const playRingtone = () => {
    stopRingtone();
    let beepCount = 0;
    ringtoneIntervalRef.current = setInterval(() => {
      if (beepCount >= 10) {
        stopRingtone();
        return;
      }
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.2;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
        
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 500);
      } catch (error) {
        console.log('Ringtone error:', error);
      }
      beepCount++;
    }, 1500);
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  const loadOrderStatus = async () => {
    try {
      const order = await orderService.getOrderById(orderId);
      if (order) {
        setDeliveryStatus(order.status);
        setProgress(order.progress || 0);
        if (order.currentPosition) {
          setTruckPosition(order.currentPosition);
        }
        if (order.remainingTimeMinutes) {
          setRemainingTime(order.remainingTimeMinutes);
        }
        
        if (order.status === 'pending' && !autoStartRef.current && supplierCoordinates && siteCoordinates) {
          autoStartRef.current = true;
          setTimeout(() => {
            startDeliverySimulation();
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error loading order status:", error);
    }
  };

  const loadMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const msgs = await chatService.getMessagesByOrder(orderId, 50);
      setMessages(msgs);
      
      if (msgs.length > 0) {
        setLastMessageTimestamp(msgs[msgs.length - 1].createdAt);
      }
      
      const unread = await chatService.getUnreadCount(orderId, 'site');
      setUnreadCount(unread);
      await chatService.markAsRead(orderId, currentUser.id, 'site');
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const analyzeMessageBeforeSend = async (message: string): Promise<MessageAnalysisResult | null> => {
    if (!message.trim()) return null;
    
    setIsAnalyzing(true);
    try {
      const analysis = await messageAnalysisService.analyzeMessage(message, currentUser.role);
      setCurrentAnalysis(analysis);
      
      if (analysis && analysis.show_suggestion) {
        setShowSuggestion(true);
        return analysis;
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing message:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (messageToSend?: string) => {
    const messageText = messageToSend || newMessage;
    if (!messageText.trim()) return;
    
    // Analyze message first
    const analysis = await analyzeMessageBeforeSend(messageText);
    
    // If analysis blocks the message, show suggestion
    if (analysis && !analysis.allow_send) {
      return; // Message is blocked, suggestion is shown
    }
    
    // If analysis suggests improvement but allows sending, show suggestion
    if (analysis && analysis.show_suggestion && !messageToSend) {
      return; // Show suggestion, don't send yet
    }
    
    // Send the message
    await sendMessageToChat(messageText);
  };

  const sendMessageToChat = async (messageText: string) => {
    setNewMessage("");
    setSending(true);
    setShowSuggestion(false);
    setCurrentAnalysis(null);
    
    try {
      if (socket && isConnected) {
        // Send via WebSocket
        socket.emit('sendMessage', {
          orderId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: 'site',
          content: messageText,
          type: 'text',
        });
      } else {
        // Fallback to HTTP
        await chatService.sendMessage({
          orderId,
          senderType: 'site',
          message: messageText,
          type: 'text'
        });
        await loadMessages(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur envoi message");
    } finally {
      setSending(false);
    }
  };

  const handleAcceptSuggestion = (improvedMessage: string) => {
    setNewMessage(improvedMessage);
    setShowSuggestion(false);
    setCurrentAnalysis(null);
  };

  const handleSendOriginal = () => {
    const originalMessage = newMessage;
    setShowSuggestion(false);
    setCurrentAnalysis(null);
    sendMessageToChat(originalMessage);
  };

  const handleDismissSuggestion = () => {
    setShowSuggestion(false);
    setCurrentAnalysis(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleSendLocation = async () => {
    if (!truckPosition) {
      toast.error("Position non disponible, démarrez d'abord la livraison");
      return;
    }
    
    try {
      await chatService.sendMessage({
        orderId,
        senderType: 'site',
        message: `📍 Position actuelle du camion - Progression: ${Math.round(progress)}% - Temps restant: ${Math.round(remainingTime)} min`,
        type: 'location',
        location: truckPosition
      });
      toast.success("Localisation partagée!");
      await loadMessages();
    } catch (error) {
      toast.error("Erreur partage localisation");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10MB)");
      return;
    }

    setSending(true);
    try {
      const result = await chatService.uploadFile(orderId, 'site', file);
      toast.success("Fichier envoyé!");
      await loadMessages();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Erreur envoi fichier");
    } finally {
      setSending(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTakePhoto = async () => {
    try {
      toast.info("Accès à la caméra...");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Votre navigateur ne supporte pas l'accès à la caméra");
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true);
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSending(true);
            try {
              await chatService.uploadFile(orderId, 'site', file);
              toast.success("Photo envoyée!");
              await loadMessages();
            } catch (error) {
              toast.error("Erreur envoi photo");
            } finally {
              setSending(false);
            }
          }
          stream.getTracks().forEach(track => track.stop());
          video.remove();
        }, 'image/jpeg', 0.8);
      } else {
        stream.getTracks().forEach(track => track.stop());
        toast.error("Impossible de capturer l'image");
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      if (error.name === 'NotAllowedError') {
        toast.error("Permission caméra refusée");
      } else if (error.name === 'NotFoundError') {
        toast.error("Aucune caméra trouvée");
      } else {
        toast.error("Impossible d'accéder à la caméra");
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current!.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current!, { type: 'audio/webm' });
        const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        
        setSending(true);
        try {
          await chatService.uploadVoice(orderId, 'site', audioBlob, duration);
          toast.success("Message vocal envoyé!");
          await loadMessages();
        } catch (error: any) {
          console.error("Error uploading voice:", error);
          toast.error(error.message || "Erreur envoi message vocal");
        } finally {
          setSending(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
        audioChunksRef.current = [];
      };
      
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      toast.info("Enregistrement en cours...");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startCall = async (videoEnabled: boolean = false) => {
    try {
      setCallStatus('ringing');
      playRingtone();
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Votre navigateur ne supporte pas les appels");
        setCallStatus('idle');
        stopRingtone();
        return;
      }
      
      const constraints: MediaStreamConstraints = { audio: true };
      if (videoEnabled) {
        constraints.video = { facingMode: 'user' };
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stopRingtone();
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsCallActive(true);
      setIsVideoActive(videoEnabled);
      setCallStatus('connected');
      
      await chatService.sendMessage({
        orderId,
        senderType: 'site',
        message: videoEnabled ? '📹 Appel vidéo' : '📞 Appel audio',
        type: 'call_request'
      });
      
      toast.success(videoEnabled ? "Appel vidéo démarré" : "Appel audio démarré");
      simulateRemoteStream();
      
    } catch (error: any) {
      console.error("Error starting call:", error);
      stopRingtone();
      if (error.name === 'NotAllowedError') {
        toast.error("Permission caméra/microphone refusée");
      } else if (error.name === 'NotFoundError') {
        toast.error("Aucune caméra/microphone trouvé");
      } else {
        toast.error("Impossible de démarrer l'appel");
      }
      setCallStatus('idle');
      setIsCallActive(false);
    }
  };
  
  const simulateRemoteStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    const interval = setInterval(() => {
      if (!remoteVideoRef.current || !isCallActive) {
        clearInterval(interval);
        return;
      }
      
      if (ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('📞 ' + supplierName, canvas.width/2 - 100, canvas.height/2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Appel en cours...', canvas.width/2 - 80, canvas.height/2 + 40);
        
        const stream = canvas.captureStream(30);
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      }
    }, 100);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    setIncomingCall(null);
    stopRingtone();
    await startCall(incomingCall.video);
  };

  const rejectCall = () => {
    setIncomingCall(null);
    stopRingtone();
    toast.info("Appel refusé");
  };

  const stopCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsCallActive(false);
    setIsVideoActive(false);
    setIsMuted(false);
    setCallStatus('idle');
    stopRingtone();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast.info(audioTrack.enabled ? "Microphone activé" : "Microphone désactivé");
      }
    }
  };

  const startDeliverySimulation = async () => {
    if (!supplierCoordinates || !siteCoordinates) {
      toast.error("Coordonnées manquantes");
      return;
    }

    if (deliveryStatus === 'in_transit' || deliveryStatus === 'delivered') {
      console.log("Livraison déjà en cours ou terminée");
      return;
    }

    const duration = estimatedDuration;
    
    if (duration <= 0) {
      toast.error("Durée invalide");
      return;
    }

    console.log("🚀 DÉMARRAGE LIVRAISON");

    try {
      await orderService.updateOrderStatus(orderId, { status: 'in_transit' });
      setDeliveryStatus('in_transit');
      
      const startLat = siteCoordinates.lat;
      const startLng = siteCoordinates.lng;
      const endLat = supplierCoordinates.lat;
      const endLng = supplierCoordinates.lng;
      
      setRemainingTime(duration);
      setTruckPosition({ lat: startLat, lng: startLng });
      setProgress(0);
      
      animationStartTimeRef.current = Date.now();
      const totalDurationMs = duration * 60 * 1000;
      
      if (deliveryTimerRef.current) {
        clearInterval(deliveryTimerRef.current);
      }
      
      deliveryTimerRef.current = setInterval(async () => {
        const elapsed = Date.now() - animationStartTimeRef.current;
        let progressRatio = elapsed / totalDurationMs;
        
        if (progressRatio > 1) progressRatio = 1;
        
        const progressVal = progressRatio * 100;
        setProgress(progressVal);
        
        const newLat = startLat + (endLat - startLat) * progressRatio;
        const newLng = startLng + (endLng - startLng) * progressRatio;
        setTruckPosition({ lat: newLat, lng: newLng });
        
        const remainingMs = Math.max(0, totalDurationMs - elapsed);
        const remainingMinutes = remainingMs / (60 * 1000);
        setRemainingTime(remainingMinutes);
        
        await orderService.updateOrderProgress(orderId, { 
          lat: newLat, 
          lng: newLng, 
          progress: Math.round(progressVal),
          remainingTime: remainingMinutes
        });
        
        if (progressRatio >= 1) {
          if (deliveryTimerRef.current) {
            clearInterval(deliveryTimerRef.current);
            deliveryTimerRef.current = null;
          }
          setDeliveryStatus('delivered');
          setProgress(100);
          setRemainingTime(0);
          setTruckPosition({ lat: endLat, lng: endLng });
          await orderService.updateOrderStatus(orderId, { status: 'delivered' });
          toast.success(`✅ Livraison terminée! Le camion est arrivé chez ${supplierName}!`);
          
          await chatService.sendMessage({
            orderId,
            senderType: 'system',
            message: `✅ Livraison terminée! Le camion est arrivé chez ${supplierName}. Distance: ${Math.round(distance)} km, Durée: ${duration} min.`,
            type: 'status_update'
          });
          await loadMessages();
          
          // Afficher le dialogue de paiement après la livraison
          await loadOrderPaymentInfo();
          setShowPayment(true);
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error starting delivery:", error);
      toast.error("Erreur démarrage livraison");
    }
  };

  const handlePaymentSuccess = async () => {
    setHasPaymentBeenProcessed(true);
    setShowPayment(false);
    
    // Envoyer un message de confirmation dans le chat
    await chatService.sendMessage({
      orderId,
      senderType: 'system',
      message: `💰 Paiement de ${paymentAmount}€ effectué avec succès pour la commande ${orderNumber}`,
      type: 'status_update'
    });
    
    await loadMessages();
    toast.success("✅ Paiement confirmé! Livraison finalisée.");
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatRemainingTime = (minutes: number): string => {
    if (minutes <= 0) return "Arrivé";
    if (minutes < 1) return `${Math.ceil(minutes * 60)} sec`;
    if (minutes < 60) return `${Math.ceil(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.ceil(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  const hasValidCoordinates = supplierCoordinates && siteCoordinates;
  
  const currentTruckPos: [number, number] | null = truckPosition 
    ? [truckPosition.lat, truckPosition.lng] 
    : null;

  const mapCenter: [number, number] = [
    ((siteCoordinates?.lat || 36.8065) + (supplierCoordinates?.lat || 36.8065)) / 2,
    ((siteCoordinates?.lng || 10.1815) + (supplierCoordinates?.lng || 10.1815)) / 2
  ];

  return (
    <>
      {/* Payment Dialog */}
      {showPayment && (
        <PaymentDialog
          open={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          orderId={orderId}
          orderNumber={orderNumber}
          materialName={materialName}
          supplierName={supplierName}
          siteName={siteName}
          amount={paymentAmount}
        />
      )}

      {/* Incoming call dialog */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-green-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Appel entrant</h3>
            <p className="text-gray-600 mb-4">{incomingCall.from}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={acceptCall} className="bg-green-600 hover:bg-green-700">
                <Phone className="h-4 w-4 mr-2" />
                Accepter
              </Button>
              <Button onClick={rejectCall} variant="destructive">
                <PhoneOff className="h-4 w-4 mr-2" />
                Refuser
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[950px] h-[85vh] flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={onClose}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {materialName}
                  </DialogTitle>
                  <p className="text-sm text-blue-100 mt-0.5">
                    🏗️ {siteName} → 🏭 {supplierName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isCallActive && callStatus === 'idle' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => startCall(false)}
                      title="Appel audio"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => startCall(true)}
                      title="Appel vidéo"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {callStatus === 'ringing' && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span className="text-sm">Appel en cours...</span>
                  </div>
                )}
                {isCallActive && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-white/20"
                      onClick={stopCall}
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {deliveryStatus === 'pending' && (
                  <Badge className="bg-yellow-500 text-white">En attente</Badge>
                )}
                {deliveryStatus === 'in_transit' && (
                  <Badge className="bg-blue-500 text-white animate-pulse">En livraison</Badge>
                )}
                {deliveryStatus === 'delivered' && (
                  <Badge className="bg-green-500 text-white">Livré</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Video call UI */}
          {isCallActive && (
            <div className="relative bg-black rounded-lg m-2 p-2" style={{ height: '200px' }}>
              {isVideoActive && remoteStream && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              )}
              {isVideoActive && localStream && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-2 right-2 w-24 h-32 object-cover rounded-lg border-2 border-white z-10"
                />
              )}
              {!isVideoActive && (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Phone className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                    <p>Appel audio en cours...</p>
                    <p className="text-xs text-gray-300 mt-1">{supplierName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "tracking")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 mt-2 grid w-[calc(100%-2rem)] grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat Fournisseur
                {unreadCount > 0 && (
                  <Badge className="ml-1 bg-red-500 text-white text-xs px-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Suivi livraison
                {deliveryStatus === 'in_transit' && (
                  <div className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              {/* ScrollArea avec hauteur fixe pour permettre le scroll manuel */}
              <ScrollArea className="flex-1 p-4" style={{ height: "calc(100% - 120px)" }}>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Aucun message</p>
                    <p className="text-sm text-gray-400">Commencez la conversation avec le fournisseur</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderRole === 'site' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.senderRole !== 'site' && msg.senderRole !== 'system' && (
                          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                            <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                              {getInitials(supplierName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="max-w-[75%]">
                          <div
                            className={`rounded-lg p-3 ${
                              msg.senderRole === 'site'
                                ? "bg-blue-600 text-white"
                                : msg.senderRole === 'system'
                                  ? "bg-gray-100 text-gray-500 italic text-sm border border-gray-200"
                                  : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {msg.senderRole !== 'site' && msg.senderRole !== 'system' && (
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                {supplierName}
                              </p>
                            )}
                            {msg.senderRole === 'system' && (
                              <p className="text-xs font-medium text-gray-400 mb-1">📢 Système</p>
                            )}
                            <div className="text-sm break-words">
                              {msg.type === 'location' && <MapPin className="inline mr-1 h-3 w-3" />}
                              {msg.type === 'call_request' && <Phone className="inline mr-1 h-3 w-3" />}
                              {msg.content}
                            </div>
                            
                            {(msg.type === 'image' || msg.type === 'voice' || msg.type === 'document') && (
                              <MessageMedia type={msg.type} metadata={msg.metadata} />
                            )}
                            
                            <p className={`text-xs mt-1 ${msg.senderRole === 'site' ? 'text-blue-200' : 'text-gray-400'}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                          
                          {/* AI Analysis Display */}
                          {msg.aiAnalysis && (
                            <MessageAnalysisDisplay 
                              analysis={msg.aiAnalysis} 
                              isOwnMessage={msg.senderRole === 'site'} 
                            />
                          )}
                        </div>
                        {msg.senderRole === 'site' && (
                          <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {getInitials(currentUser.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Barre d'outils fixe en bas */}
              <div className="p-4 border-t bg-gray-50">
                {/* Message Suggestion */}
                {showSuggestion && currentAnalysis && (
                  <MessageSuggestion
                    analysis={currentAnalysis}
                    onAcceptSuggestion={handleAcceptSuggestion}
                    onDismiss={handleDismissSuggestion}
                    onSendOriginal={handleSendOriginal}
                  />
                )}

                {/* Connection Status */}
                {!isConnected && (
                  <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-sm text-yellow-800">
                    🔄 Reconnexion en cours...
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendLocation}
                    disabled={!truckPosition || deliveryStatus !== 'in_transit'}
                    title="Partager position"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRecording}
                    className={isRecording ? "bg-red-100 text-red-600 animate-pulse" : ""}
                    title="Message vocal"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    title="Pièce jointe"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTakePhoto}
                    title="Prendre une photo"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {deliveryStatus === 'delivered' && !hasPaymentBeenProcessed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPayment(true)}
                      className="bg-green-100 text-green-700 hover:bg-green-200"
                      title="Payer"
                    >
                      <Wallet className="h-4 w-4 mr-1" />
                      Payer
                    </Button>
                  )}
                  {deliveryStatus === 'delivered' && hasPaymentBeenProcessed && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Payé
                    </Badge>
                  )}
                  {deliveryStatus === 'delivered' && !hasPaymentBeenProcessed && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <Wallet className="h-3 w-3 mr-1" />
                      En attente de paiement
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={deliveryStatus === 'delivered' && !hasPaymentBeenProcessed}
                    className="flex-1"
                  />
                  <EmojiPicker 
                    onEmojiSelect={handleEmojiSelect}
                    disabled={deliveryStatus === 'delivered' && !hasPaymentBeenProcessed}
                  />
                  <Button 
                    onClick={() => handleSendMessage()} 
                    disabled={!newMessage.trim() || sending || isAnalyzing || (deliveryStatus === 'delivered' && !hasPaymentBeenProcessed)}
                  >
                    {sending || isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              <div className="flex-1 relative">
                {hasValidCoordinates ? (
                  <>
                    <MapContainer
                      center={currentTruckPos || [mapCenter[0], mapCenter[1]]}
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      
                      <Marker position={[siteCoordinates.lat, siteCoordinates.lng]} icon={siteIconMap}>
                        <Popup>
                          <div className="text-center">
                            <strong>🏗️ DÉPART: Chantier</strong><br />
                            {siteName}
                          </div>
                        </Popup>
                      </Marker>
                      
                      <Marker position={[supplierCoordinates.lat, supplierCoordinates.lng]} icon={supplierIconMap}>
                        <Popup>
                          <div className="text-center">
                            <strong>🏭 ARRIVÉE: Fournisseur</strong><br />
                            {supplierName}<br />
                            Distance: {Math.round(distance)} km
                          </div>
                        </Popup>
                      </Marker>
                      
                      <Polyline
                        positions={[
                          [siteCoordinates.lat, siteCoordinates.lng],
                          [supplierCoordinates.lat, supplierCoordinates.lng]
                        ]}
                        color="#2563eb"
                        weight={4}
                        opacity={0.7}
                        dashArray="10, 10"
                      />
                      
                      {truckPosition && (
                        <Marker position={[truckPosition.lat, truckPosition.lng]} icon={truckIcon}>
                          <Popup>
                            <div className="text-center">
                              <strong>🚚 Camion</strong><br />
                              🏗️ {siteName} → 🏭 {supplierName}<br />
                              Progression: {Math.round(progress)}%<br />
                              Reste: {formatRemainingTime(remainingTime)}
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      
                      <MapUpdater position={currentTruckPos} />
                    </MapContainer>

                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg border border-gray-200 z-[1000]">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">🏗️ Chantier → 🏭 Fournisseur</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <span>🏗️ {siteName.substring(0, 15)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <Truck className="h-3 w-3" />
                          <span>{Math.round(distance * progress / 100)}/{Math.round(distance)} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🏭 {supplierName.substring(0, 15)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm mb-3">
                        <span className="text-gray-500">⏱️ Temps restant:</span>
                        <span className={`font-semibold ${remainingTime < 5 && remainingTime > 0 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                          {formatRemainingTime(remainingTime)}
                        </span>
                      </div>
                      
                      {deliveryStatus === 'pending' && (
                        <Button 
                          onClick={startDeliverySimulation}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          🚚 Démarrer la livraison ({formatRemainingTime(estimatedDuration)})
                        </Button>
                      )}
                      
                      {deliveryStatus === 'in_transit' && (
                        <div className="flex items-center justify-center gap-3 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                          <span className="text-sm">Livraison en cours...</span>
                          <span className="text-sm font-medium">{Math.round(progress)}%</span>
                        </div>
                      )}
                      
                      {deliveryStatus === 'delivered' && !hasPaymentBeenProcessed && (
                        <Button 
                          onClick={() => setShowPayment(true)}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2"
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          💰 Payer {paymentAmount}€
                        </Button>
                      )}
                      
                      {deliveryStatus === 'delivered' && hasPaymentBeenProcessed && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">✅ Livraison terminée et payée!</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Navigation className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">Coordonnées GPS non disponibles</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Le fournisseur ou le site n'a pas de coordonnées GPS
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}