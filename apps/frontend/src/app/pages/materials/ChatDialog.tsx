"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { 
  Send, Mic, Paperclip, MapPin, Truck, ArrowLeft, 
  MessageCircle, Navigation, Clock, CheckCircle, 
  Loader2, X, Image as ImageIcon, FileText, Play, Pause, Download
} from "lucide-react";
import chatService, { ChatMessage } from "../../../services/chatService";
import { chatSocket } from "../../../services/chatSocket";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import orderService from "../../../services/orderService";

// Icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône camion
const truckIcon = L.icon({
  iconUrl: "/truck.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
});

// Icône fournisseur (destination) - warehouse.png
const supplierIconMap = L.icon({
  iconUrl: "/warehouse.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Icône chantier (départ) - construction-site.png
const siteIconMap = L.icon({
  iconUrl: "/construction-site.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Composant pour centrer la carte sur le camion
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

// Composant pour afficher les messages avec média
const MessageMedia = ({ type, metadata }: { type: string; metadata?: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (type === 'image' && metadata?.file) {
    return (
      <div className="mt-2">
        <img 
          src={metadata.file} 
          alt={metadata.fileName || "Image"} 
          className="max-w-[200px] max-h-[150px] rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => window.open(metadata.file, '_blank')}
        />
        <p className="text-xs mt-1 text-gray-500">{metadata.fileName}</p>
      </div>
    );
  }

  if (type === 'voice' && metadata?.audio) {
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
          src={metadata.audio}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        <div className="flex-1 h-1 bg-gray-300 rounded-full">
          <div className="w-0 h-full bg-blue-500 rounded-full" />
        </div>
        <span className="text-xs text-gray-500">Message vocal</span>
      </div>
    );
  }

  if (type === 'file' && metadata?.file) {
    return (
      <div className="mt-2 flex items-center gap-2 bg-gray-100 rounded-lg p-2">
        <FileText className="h-4 w-4 text-gray-500" />
        <span className="text-sm truncate max-w-[150px]">{metadata.fileName}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => window.open(metadata.file, '_blank')}
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
  const [activeTab, setActiveTab] = useState<"chat" | "tracking">("tracking");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState<"pending" | "in_transit" | "delivered">("pending");
  const [truckPosition, setTruckPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const deliveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Calcul de la distance et durée estimée (Site → Fournisseur)
  useEffect(() => {
    if (supplierCoordinates && siteCoordinates) {
      const dist = calculateDistance(
        siteCoordinates.lat,
        siteCoordinates.lng,
        supplierCoordinates.lat,
        supplierCoordinates.lng
      );
      setDistance(dist);
      setEstimatedDuration(Math.max(1, Math.round(dist * 2))); // au moins 1 minute
      setRemainingTime(Math.max(1, Math.round(dist * 2)));
      console.log("📏 Distance calculée:", dist, "km → Durée estimée:", Math.round(dist * 2), "min");
    }
  }, [supplierCoordinates, siteCoordinates]);

  // Chargement des messages
  useEffect(() => {
    if (open && orderId) {
      loadMessages();
      connectWebSocket();
      loadOrderStatus();
    }
    return () => {
      chatSocket.leaveOrder(orderId);
      if (deliveryTimerRef.current) {
        clearInterval(deliveryTimerRef.current);
      }
    };
  }, [open, orderId]);

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
      }
    } catch (error) {
      console.error("Error loading order status:", error);
    }
  };

  const connectWebSocket = () => {
    chatSocket.connect(currentUser.id, [orderId]);
    chatSocket.joinOrder(orderId);
    
    chatSocket.on('new-message', (data: any) => {
      setMessages(prev => [...prev, data.message]);
      if (data.message.senderType !== 'site') {
        setUnreadCount(prev => prev + 1);
      }
    });
    
    chatSocket.on('user-typing', (data: any) => {
      if (data.userId !== currentUser.id) {
        setTypingUsers(prev => 
          data.isTyping 
            ? [...prev, data.userId]
            : prev.filter(id => id !== data.userId)
        );
      }
    });
    
    chatSocket.on('messages-read', (data: any) => {
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await chatService.getMessagesByOrder(orderId, 50);
      setMessages(msgs);
      const unread = await chatService.getUnreadCount(orderId, 'site');
      setUnreadCount(unread);
      await chatService.markAsRead(orderId, currentUser.id, 'site');
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageText = newMessage;
    setNewMessage("");
    setSending(true);
    
    try {
      await chatService.sendMessage({
        orderId,
        senderType: 'site',
        message: messageText,
        type: 'text'
      });
      chatSocket.sendMessage({
        orderId,
        senderType: 'site',
        message: messageText,
        type: 'text'
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur envoi message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    chatSocket.sendTyping(orderId, currentUser.id, isTyping);
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
        message: `📍 Position actuelle du camion - Progression: ${Math.round(progress)}% - Temps restant: ${remainingTime} min`,
        type: 'location',
        location: truckPosition
      });
      toast.success("Localisation partagée!");
    } catch (error) {
      toast.error("Erreur partage localisation");
    }
  };

  // Upload de fichier/image
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target?.result as string;
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      
      try {
        await chatService.sendMessage({
          orderId,
          senderType: 'site',
          message: messageType === 'image' ? `📷 ${file.name}` : `📎 ${file.name}`,
          type: messageType,
          metadata: { 
            file: fileContent, 
            fileName: file.name, 
            fileType: file.type,
            fileSize: file.size
          }
        });
        toast.success("Fichier envoyé!");
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Erreur envoi fichier");
      }
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enregistrement vocal
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const audioContent = e.target?.result as string;
          try {
            await chatService.sendMessage({
              orderId,
              senderType: 'site',
              message: "🎤 Message vocal",
              type: 'voice',
              metadata: { 
                audio: audioContent, 
                duration: audioChunksRef.current.length,
                fileName: `voice_${Date.now()}.webm`
              }
            });
            toast.success("Message vocal envoyé!");
          } catch (error) {
            toast.error("Erreur envoi message vocal");
          }
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
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

  // ========== SIMULATION DE LIVRAISON CORRIGÉE ==========
  // Le camion part du SITE (Chantier) vers le FOURNISSEUR
  const startDeliverySimulation = async () => {
    if (!supplierCoordinates || !siteCoordinates) {
      toast.error("Coordonnées manquantes");
      return;
    }

    console.log("🚀 Démarrage livraison - Départ Chantier → Arrivée Fournisseur");
    console.log("📍 Départ (Site):", siteCoordinates.lat, siteCoordinates.lng);
    console.log("📍 Arrivée (Fournisseur):", supplierCoordinates.lat, supplierCoordinates.lng);
    console.log("⏱️ Durée estimée:", estimatedDuration, "minutes");

    try {
      await orderService.updateOrderStatus(orderId, { status: 'in_transit' });
      setDeliveryStatus('in_transit');
      
      // POINT DE DÉPART: SITE (Chantier)
      const startLat = siteCoordinates.lat;
      const startLng = siteCoordinates.lng;
      
      // POINT D'ARRIVÉE: FOURNISSEUR
      const endLat = supplierCoordinates.lat;
      const endLng = supplierCoordinates.lng;
      
      const duration = estimatedDuration;
      setRemainingTime(duration);
      
      const steps = 30;
      const intervalMs = Math.max(500, (duration * 60 * 1000) / steps);
      let step = 0;
      
      if (deliveryTimerRef.current) clearInterval(deliveryTimerRef.current);
      
      deliveryTimerRef.current = setInterval(async () => {
        step++;
        const progressVal = Math.min(100, (step / steps) * 100);
        setProgress(progressVal);
        
        // Calcul de la position intermédiaire (interpolation linéaire)
        const newLat = startLat + (endLat - startLat) * (step / steps);
        const newLng = startLng + (endLng - startLng) * (step / steps);
        setTruckPosition({ lat: newLat, lng: newLng });
        
        const timeLeft = Math.max(0, Math.round(duration * (1 - step / steps)));
        setRemainingTime(timeLeft);
        
        console.log(`📍 Étape ${step}/${steps} - Progression: ${Math.round(progressVal)}% - Temps restant: ${timeLeft} min`);
        
        await orderService.updateOrderProgress(orderId, { 
          lat: newLat, 
          lng: newLng, 
          progress: Math.round(progressVal),
          remainingTime: timeLeft
        });
        
        if (step >= steps) {
          if (deliveryTimerRef.current) clearInterval(deliveryTimerRef.current);
          setDeliveryStatus('delivered');
          setProgress(100);
          setRemainingTime(0);
          await orderService.updateOrderStatus(orderId, { status: 'delivered' });
          toast.success(`✅ Livraison terminée! Le camion est arrivé chez ${supplierName}!`);
          
          await chatService.sendMessage({
            orderId,
            senderType: 'system',
            message: `✅ Livraison terminée! Le camion est arrivé chez ${supplierName}. Distance: ${Math.round(distance)} km, Durée: ${estimatedDuration} min.`,
            type: 'status_update'
          });
        }
      }, intervalMs);
    } catch (error) {
      console.error("Error starting delivery:", error);
      toast.error("Erreur démarrage livraison");
    }
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
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasValidCoordinates = supplierCoordinates && siteCoordinates;
  
  // Position actuelle du camion pour le suivi
  const currentTruckPos: [number, number] | null = truckPosition 
    ? [truckPosition.lat, truckPosition.lng] 
    : null;

  // Centre de la carte entre départ et arrivée
  const mapCenter: [number, number] = [
    (siteCoordinates?.lat || 36.8065 + supplierCoordinates?.lat || 36.8065) / 2,
    (siteCoordinates?.lng || 10.1815 + supplierCoordinates?.lng || 10.1815) / 2
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[950px] h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
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

        {/* Tabs */}
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

          {/* Onglet Chat */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
            <ScrollArea className="flex-1 p-4">
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
                      className={`flex ${msg.senderType === 'site' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.senderType !== 'site' && msg.senderType !== 'system' && (
                        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                          <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                            {getInitials(supplierName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          msg.senderType === 'site'
                            ? "bg-blue-600 text-white"
                            : msg.senderType === 'system'
                              ? "bg-gray-100 text-gray-500 italic text-sm border border-gray-200"
                              : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {msg.senderType !== 'site' && msg.senderType !== 'system' && (
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {supplierName}
                          </p>
                        )}
                        {msg.senderType === 'system' && (
                          <p className="text-xs font-medium text-gray-400 mb-1">📢 Système</p>
                        )}
                        <div className="text-sm break-words">
                          {msg.type === 'location' && <MapPin className="inline mr-1 h-3 w-3" />}
                          {msg.message}
                        </div>
                        
                        {(msg.type === 'image' || msg.type === 'voice' || msg.type === 'file') && (
                          <MessageMedia type={msg.type} metadata={msg.metadata} />
                        )}
                        
                        <p className={`text-xs mt-1 ${msg.senderType === 'site' ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                      {msg.senderType === 'site' && (
                        <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {getInitials(currentUser.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className="ml-1 text-xs">{supplierName} écrit...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Zone de saisie */}
            <div className="p-4 border-t bg-gray-50">
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {deliveryStatus === 'delivered' && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Livré
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping(true);
                  }}
                  onBlur={() => handleTyping(false)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={deliveryStatus === 'delivered'}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || sending || deliveryStatus === 'delivered'}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Suivi - Trajet: SITE (Départ) → FOURNISSEUR (Arrivée) */}
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
                    
                    {/* 🏗️ POINT DE DÉPART: Site (Chantier) - construction-site.png */}
                    <Marker position={[siteCoordinates.lat, siteCoordinates.lng]} icon={siteIconMap}>
                      <Popup>
                        <div className="text-center">
                          <strong>🏗️ DÉPART: Chantier</strong><br />
                          {siteName}
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* 🏭 POINT D'ARRIVÉE: Fournisseur - warehouse.png */}
                    <Marker position={[supplierCoordinates.lat, supplierCoordinates.lng]} icon={supplierIconMap}>
                      <Popup>
                        <div className="text-center">
                          <strong>🏭 ARRIVÉE: Fournisseur</strong><br />
                          {supplierName}<br />
                          Distance: {Math.round(distance)} km
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Ligne du trajet (Site → Fournisseur) */}
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
                    
                    {/* Camion en mouvement */}
                    {truckPosition && (
                      <Marker position={[truckPosition.lat, truckPosition.lng]} icon={truckIcon}>
                        <Popup>
                          <div className="text-center">
                            <strong>🚚 Camion</strong><br />
                            🏗️ {siteName} → 🏭 {supplierName}<br />
                            Progression: {Math.round(progress)}%<br />
                            Distance parcourue: {Math.round((distance * progress) / 100)} km<br />
                            Reste: {remainingTime > 0 ? `${remainingTime} min` : "Arrivé"}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    <MapUpdater position={currentTruckPos} />
                  </MapContainer>

                  {/* Overlay de progression en temps réel */}
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
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
                    
                    {/* BOUTON DÉMARRER LA LIVRAISON - Visible si la commande est en attente */}
                    {deliveryStatus === 'pending' && (
                      <Button 
                        onClick={startDeliverySimulation}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        🚚 Démarrer la livraison (Chantier → Fournisseur)
                      </Button>
                    )}
                    
                    {deliveryStatus === 'in_transit' && (
                      <div className="flex items-center justify-center gap-3 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                        <span className="text-sm">Livraison en cours...</span>
                        <span className="text-sm font-medium">{Math.round(progress)}%</span>
                      </div>
                    )}
                    
                    {deliveryStatus === 'delivered' && (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">✅ Livraison terminée !</span>
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
  );
}