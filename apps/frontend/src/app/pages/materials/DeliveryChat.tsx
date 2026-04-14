"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Send, Mic, Paperclip, MapPin, Loader2 } from "lucide-react";
import chatService, { ChatMessage } from "../../../services/chatService";
import { chatSocket } from "../../../services/chatSocket";

interface DeliveryConversation {
  orderId: string;
  materialName: string;
  supplierName: string;
  siteName: string;
  status: string;
  lastMessage?: string;
  lastMessageDate?: Date;
  unreadCount: number;
}

interface DeliveryChatProps {
  currentUser: {
    id: string;
    name: string;
    role: "works_manager" | "procurement_manager";
  };
}

export default function DeliveryChat({ currentUser }: DeliveryChatProps) {
  const [conversations, setConversations] = useState<DeliveryConversation[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les conversations (à implémenter avec votre API)
  useEffect(() => {
    loadConversations();
    connectWebSocket();
    
    return () => {
      chatSocket.disconnect();
    };
  }, []);

  const connectWebSocket = () => {
    chatSocket.connect(currentUser.id, []);
    
    chatSocket.on('new-message', (data: any) => {
      if (data.message.orderId === selectedOrderId) {
        setMessages(prev => [...prev, data.message]);
      }
      loadConversations(); // Mettre à jour la liste des conversations
    });
    
    chatSocket.on('messages-read', (data: any) => {
      if (data.orderId === selectedOrderId) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    });
  };

  const loadConversations = async () => {
    // À implémenter : appel API pour récupérer les conversations
    // GET /api/chat/sites/:siteId/conversations ou /api/chat/suppliers/:supplierId/conversations
  };

  const loadMessages = async (orderId: string) => {
    setLoadingMessages(true);
    setSelectedOrderId(orderId);
    chatSocket.joinOrder(orderId);
    
    try {
      const msgs = await chatService.getMessagesByOrder(orderId, 50);
      setMessages(msgs);
      // Marquer comme lus
      await chatService.markAsRead(orderId, currentUser.id, currentUser.role);
      chatSocket.markAsRead(orderId, currentUser.id, currentUser.role);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erreur chargement messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrderId) return;
    
    const messageText = newMessage;
    setNewMessage("");
    
    try {
      const result = await chatService.sendMessage({
        orderId: selectedOrderId,
        senderType: currentUser.role === 'works_manager' ? 'site' : 'supplier',
        message: messageText,
        type: 'text'
      });
      
      // Émettre via WebSocket pour temps réel
      chatSocket.sendMessage({
        orderId: selectedOrderId,
        senderType: currentUser.role === 'works_manager' ? 'site' : 'supplier',
        message: messageText,
        type: 'text'
      });
      
      toast.success("Message envoyé!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur envoi message");
    }
  };

  const handleSendLocation = async () => {
    if (!selectedOrderId) return;
    
    // Simuler la position actuelle
    const location = { lat: 36.8200, lng: 10.2000 };
    
    try {
      await chatService.sendMessage({
        orderId: selectedOrderId,
        senderType: currentUser.role === 'works_manager' ? 'site' : 'supplier',
        message: "📍 Position actuelle",
        type: 'location',
        location
      });
      
      chatSocket.sendMessage({
        orderId: selectedOrderId,
        senderType: currentUser.role === 'works_manager' ? 'site' : 'supplier',
        message: "📍 Position actuelle",
        type: 'location',
        location
      });
      
      toast.success("Localisation partagée!");
    } catch (error) {
      toast.error("Erreur partage localisation");
    }
  };

  const handleArrivalConfirmation = async () => {
    if (!selectedOrderId) return;
    
    try {
      await chatService.sendArrivalConfirmation(selectedOrderId);
      toast.success("Confirmation d'arrivée envoyée!");
    } catch (error) {
      toast.error("Erreur confirmation");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500">En attente</Badge>;
      case "in_transit": return <Badge className="bg-blue-500">En cours</Badge>;
      case "delivered": return <Badge className="bg-green-500">Livré</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Conversations</CardTitle>
          <p className="text-sm text-gray-500">Livraisons en cours</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune conversation
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.orderId}
                onClick={() => loadMessages(conv.orderId)}
                className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                  selectedOrderId === conv.orderId
                    ? "bg-blue-50 border-blue-300 border"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm">{conv.materialName}</span>
                  {getStatusBadge(conv.status)}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>🏭 {conv.supplierName}</div>
                  <div>🏗️ {conv.siteName}</div>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      {conv.unreadCount} nouveau(x)
                    </Badge>
                  </div>
                )}
                {conv.lastMessage && (
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    {conv.lastMessage}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedOrderId ? (
          <>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    Conversation
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Commandes en cours
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun message. Commencez la conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'site' ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderType === 'site'
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="text-xs mb-1 opacity-75">
                        {msg.senderType === 'site' ? 'Chantier' : 'Fournisseur'} • {formatTime(msg.createdAt)}
                      </div>
                      <div className="text-sm">
                        {msg.type === "location" && <MapPin className="inline mr-1 h-4 w-4" />}
                        {msg.type === "arrival_confirmation" && "✅ "}
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendLocation}
                  title="Envoyer localisation"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                  className={isRecording ? "bg-red-100 text-red-600" : ""}
                  title="Message vocal"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" title="Pièce jointe">
                  <Paperclip className="h-4 w-4" />
                </Button>
                {currentUser.role === "procurement_manager" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-100 text-green-700 hover:bg-green-200"
                    onClick={handleArrivalConfirmation}
                    title="Confirmer arrivée"
                  >
                    ✅ Arrivé
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Sélectionnez une conversation pour commencer
          </div>
        )}
      </Card>
    </div>
  );
}