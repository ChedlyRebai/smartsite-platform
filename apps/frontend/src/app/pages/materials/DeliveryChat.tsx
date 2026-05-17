"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import { Send, Mic, Paperclip, MapPin, Loader2, RefreshCw, MessageCircle } from "lucide-react";
import chatService, { ChatMessage } from "../../../services/chatService";
import { chatSocket } from "../../../services/chatSocket";
import orderService, { MaterialOrder } from "../../../services/orderService";
import TruckArrivalPaymentDialog from "../../components/materials/TruckArrivalPaymentDialog";

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
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [roomEmotion, setRoomEmotion] = useState<'CALM' | 'CONFLICT'>('CALM');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogData, setPaymentDialogData] = useState<{
    orderId: string;
    materialName: string;
    supplierName: string;
    amount: number;
    siteId: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active orders and build conversation list
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      // Get all active orders (pending, in_transit, delivered)
      const [activeOrders, allOrders] = await Promise.all([
        orderService.getActiveOrders().catch(() => [] as MaterialOrder[]),
        orderService.getAllOrders().catch(() => [] as MaterialOrder[]),
      ]);

      // Merge without duplicates
      const ordersMap = new Map<string, MaterialOrder>();
      [...activeOrders, ...allOrders].forEach((o) => {
        if (o._id) ordersMap.set(o._id, o);
      });
      const orders = Array.from(ordersMap.values());

      // For each order, get last message and unread count
      const convPromises = orders.map(async (order): Promise<DeliveryConversation> => {
        let lastMessage: string | undefined;
        let unreadCount = 0;

        try {
          const msgs = await chatService.getMessagesByOrder(order._id, 1);
          if (msgs.length > 0) {
            lastMessage = msgs[msgs.length - 1].content?.substring(0, 60);
          }
        } catch {
          // ignore if no messages
        }

        try {
          const userType = currentUser.role === "works_manager" ? "site" : "supplier";
          unreadCount = await chatService.getUnreadCount(order._id, userType);
        } catch {
          // ignore
        }

        return {
          orderId: order._id,
          materialName: order.materialName || "Material",
          supplierName: order.supplierName || "Supplier",
          siteName: order.destinationSiteName || "Site",
          status: order.status || "pending",
          lastMessage,
          lastMessageDate: order.updatedAt ? new Date(order.updatedAt as any) : undefined,
          unreadCount,
        };
      });

      const convs = await Promise.all(convPromises);

      // Sort: active orders first, then by date
      convs.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          in_transit: 0,
          pending: 1,
          delivered: 2,
          delayed: 3,
          cancelled: 4,
        };
        const orderA = statusOrder[a.status] ?? 5;
        const orderB = statusOrder[b.status] ?? 5;
        if (orderA !== orderB) return orderA - orderB;
        const dateA = a.lastMessageDate?.getTime() ?? 0;
        const dateB = b.lastMessageDate?.getTime() ?? 0;
        return dateB - dateA;
      });

      setConversations(convs);

      // Auto-select first in-transit order if none selected
      if (!selectedOrderId && convs.length > 0) {
        const inTransit = convs.find((c) => c.status === "in_transit");
        setSelectedOrderId(inTransit?.orderId ?? convs[0].orderId);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Error loading conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUser.role, selectedOrderId]);

  // WebSocket connection and polling
  useEffect(() => {
    loadConversations();
    connectWebSocket();

    // Polling every 10s to refresh the list
    pollingRef.current = setInterval(() => {
      loadConversations();
    }, 10000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      chatSocket.disconnect();
    };
  }, []);

  const connectWebSocket = () => {
    chatSocket.connect(currentUser.id, []);

    chatSocket.on("new-message", (data: any) => {
      const msg: ChatMessage = data.message;
      if (msg.orderId === selectedOrderId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.orderId === msg.orderId
            ? { ...c, lastMessage: msg.content?.substring(0, 60) }
            : c
        )
      );
    });

    chatSocket.on("messages-read", (data: any) => {
      if (data.orderId === selectedOrderId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
      // Reset unread count
      setConversations((prev) =>
        prev.map((c) =>
          c.orderId === data.orderId ? { ...c, unreadCount: 0 } : c
        )
      );
    });

    chatSocket.on("delivery-progress", (data: any) => {
      // Update status in list if needed
      loadConversations();
    });

    // Listen for emotion analysis
    chatSocket.on("messageAnalysis", (data: any) => {
      if (data.analysis && data.analysis.emotion) {
        setRoomEmotion(data.analysis.emotion);
      }
    });

    chatSocket.on("roomEmotionUpdate", (data: any) => {
      if (data.emotion) {
        setRoomEmotion(data.emotion);
      }
    });

    // Listen for payment dialog open event
    chatSocket.on("openPaymentDialog", (data: any) => {
      // Open dialog only for works_manager role (site)
      if (currentUser.role === "works_manager") {
        setPaymentDialogData({
          orderId: data.orderId,
          materialName: data.materialName,
          supplierName: data.supplierName,
          amount: data.amount,
          siteId: data.siteId,
        });
        setPaymentDialogOpen(true);
        toast.info(`🚚 The truck from ${data.supplierName} has arrived!`);
      }
    });
  };

  // Load messages for an order
  const loadMessages = async (orderId: string) => {
    setLoadingMessages(true);
    setSelectedOrderId(orderId);

    // Join WebSocket room
    chatSocket.joinOrder(orderId);

    try {
      const msgs = await chatService.getMessagesByOrder(orderId, 50);
      setMessages(msgs);

      // Mark as read
      const userType = currentUser.role === "works_manager" ? "site" : "supplier";
      await chatService.markAsRead(orderId, currentUser.id, userType);
      chatSocket.markAsRead(orderId, currentUser.id, userType);

      // Reset in list
      setConversations((prev) =>
        prev.map((c) => (c.orderId === orderId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error loading messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  // When selectedOrderId changes, load messages
  useEffect(() => {
    if (selectedOrderId) {
      loadMessages(selectedOrderId);
    }
  }, [selectedOrderId]);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send text message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrderId) return;

    const messageText = newMessage;
    setNewMessage("");
    setSending(true);

    const senderType = currentUser.role === "works_manager" ? "site" : "supplier";

    try {
      await chatService.sendMessage({
        orderId: selectedOrderId,
        senderType,
        message: messageText,
        type: "text",
      });

      chatSocket.sendMessage({
        orderId: selectedOrderId,
        senderType,
        message: messageText,
        type: "text",
      });

      // Reload messages to be sure
      const msgs = await chatService.getMessagesByOrder(selectedOrderId, 50);
      setMessages(msgs);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message");
      setNewMessage(messageText); // Put message back on error
    } finally {
      setSending(false);
    }
  };

  // Send current location
  const handleSendLocation = async () => {
    if (!selectedOrderId) return;

    if (!navigator.geolocation) {
      toast.error("Geolocation not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Current location",
        };
        const senderType = currentUser.role === "works_manager" ? "site" : "supplier";
        try {
          await chatService.sendMessage({
            orderId: selectedOrderId,
            senderType,
            message: `📍 Current location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`,
            type: "location",
            location,
          });
          chatSocket.sendLocation(selectedOrderId, location);
          toast.success("Location shared!");
          const msgs = await chatService.getMessagesByOrder(selectedOrderId, 50);
          setMessages(msgs);
          scrollToBottom();
        } catch (error) {
          toast.error("Error sharing location");
        }
      },
      () => {
        // Fallback default coordinates (Tunis)
        const location = { lat: 36.8065, lng: 10.1815, address: "Simulated location" };
        const senderType = currentUser.role === "works_manager" ? "site" : "supplier";
        chatService.sendMessage({
          orderId: selectedOrderId,
          senderType,
          message: "📍 Current location",
          type: "location",
          location,
        });
        toast.success("Location shared (simulated)!");
      }
    );
  };

  // Voice message
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = Math.round(audioBlob.size / 16000);
        stream.getTracks().forEach((t) => t.stop());

        if (!selectedOrderId) return;
        const senderType = currentUser.role === "works_manager" ? "site" : "supplier";
        try {
          await chatService.uploadVoice(selectedOrderId, senderType, audioBlob, duration);
          toast.success("Voice message sent!");
          const msgs = await chatService.getMessagesByOrder(selectedOrderId, 50);
          setMessages(msgs);
          scrollToBottom();
        } catch {
          toast.error("Error sending voice message");
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      toast.info("Recording... (click again to stop)");
    } catch {
      toast.error("Microphone not accessible");
    }
  };

  // File attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10 MB)");
      return;
    }

    const senderType = currentUser.role === "works_manager" ? "site" : "supplier";
    try {
      await chatService.uploadFile(selectedOrderId, senderType, file);
      toast.success("File sent!");
      const msgs = await chatService.getMessagesByOrder(selectedOrderId, 50);
      setMessages(msgs);
      scrollToBottom();
    } catch {
      toast.error("Error sending file");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Arrival confirmation (supplier/delivery side)
  const handleArrivalConfirmation = async () => {
    if (!selectedOrderId) return;
    try {
      await chatService.sendArrivalConfirmation(selectedOrderId);
      toast.success("Arrival confirmation sent!");
      const msgs = await chatService.getMessagesByOrder(selectedOrderId, 50);
      setMessages(msgs);
      scrollToBottom();
    } catch {
      toast.error("Error sending confirmation");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-white text-xs">Pending</Badge>;
      case "in_transit":
        return <Badge className="bg-blue-500 text-white text-xs">In transit</Badge>;
      case "delivered":
        return <Badge className="bg-green-500 text-white text-xs">Delivered</Badge>;
      case "delayed":
        return <Badge className="bg-red-500 text-white text-xs">Delayed</Badge>;
      default:
        return <Badge className="text-xs">{status}</Badge>;
    }
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.senderRole === "system") return "System";
    if (msg.senderRole === "site") return "Site";
    return msg.senderName || "Supplier";
  };

  const isMyMessage = (msg: ChatMessage) => {
    const myRole = currentUser.role === "works_manager" ? "site" : "supplier";
    return msg.senderRole === myRole;
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Payment dialog on truck arrival */}
      {paymentDialogData && (
        <TruckArrivalPaymentDialog
          open={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setPaymentDialogData(null);
          }}
          orderId={paymentDialogData.orderId}
          materialName={paymentDialogData.materialName}
          supplierName={paymentDialogData.supplierName}
          amount={paymentDialogData.amount}
          siteId={paymentDialogData.siteId}
        />
      )}

      {/* Conversation list */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConversations}
              disabled={loadingConversations}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loadingConversations ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="text-sm text-gray-500">Active deliveries</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          {loadingConversations && conversations.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No active orders</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.orderId}
                onClick={() => loadMessages(conv.orderId)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') loadMessages(conv.orderId); }}
                role="button"
                tabIndex={0}
                className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                  selectedOrderId === conv.orderId
                    ? "bg-blue-50 border border-blue-300"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm truncate flex-1 mr-2">
                    {conv.materialName}
                  </span>
                  {getStatusBadge(conv.status)}
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="truncate">🏭 {conv.supplierName}</div>
                  <div className="truncate">🏗️ {conv.siteName}</div>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      {conv.unreadCount} new
                    </Badge>
                  </div>
                )}
                {conv.lastMessage && (
                  <div className="mt-1 text-xs text-gray-400 truncate">{conv.lastMessage}</div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Conversation area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {selectedOrderId ? (
          <>
            <CardHeader className="border-b pb-3">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {conversations.find((c) => c.orderId === selectedOrderId)?.materialName ||
                        "Conversation"}
                    </CardTitle>
                    {/* Emotion indicator */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      roomEmotion === 'CONFLICT' 
                        ? 'bg-red-100 text-red-700 animate-pulse' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      <span className="text-base">{roomEmotion === 'CONFLICT' ? '🔴' : '🟢'}</span>
                      <span>{roomEmotion === 'CONFLICT' ? 'Conflict' : 'Calm'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {conversations.find((c) => c.orderId === selectedOrderId)?.supplierName} →{" "}
                    {conversations.find((c) => c.orderId === selectedOrderId)?.siteName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedOrderId && loadMessages(selectedOrderId)}
                  title="Refresh messages"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No messages. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${isMyMessage(msg) ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderRole === "system"
                          ? "bg-gray-100 text-gray-500 italic text-sm border border-gray-200"
                          : isMyMessage(msg)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {!isMyMessage(msg) && msg.senderRole !== "system" && (
                        <div className="text-xs font-medium mb-1 opacity-75">
                          {getSenderLabel(msg)}
                        </div>
                      )}
                      {msg.senderRole === "system" && (
                        <div className="text-xs font-medium mb-1 text-gray-400">📢 System</div>
                      )}
                      <div className="text-sm break-words">
                        {msg.type === "location" && (
                          <MapPin className="inline mr-1 h-3 w-3" />
                        )}
                        {msg.type === "arrival_confirmation" && "✅ "}
                        {msg.content || (msg as any).message}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isMyMessage(msg) ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Toolbar */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendLocation}
                  title="Send location"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRecording}
                  className={isRecording ? "bg-red-100 text-red-600 animate-pulse" : ""}
                  title="Voice message"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attachment"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {currentUser.role === "procurement_manager" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-100 text-green-700 hover:bg-green-200"
                    onClick={handleArrivalConfirmation}
                    title="Confirm arrival"
                  >
                    ✅ Arrived
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  disabled={sending}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Select a conversation to start</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}