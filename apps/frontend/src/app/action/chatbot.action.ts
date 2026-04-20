import axios from 'axios';
import { AUTH_API_URL } from '@/lib/auth-api-url';

const API_URL = `${AUTH_API_URL}/chatbot`;

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('smartsite-auth');
  const token =
    localStorage.getItem('access_token') ||
    (authData
      ? (() => {
          try {
            return JSON.parse(authData)?.state?.user?.access_token;
          } catch {
            return null;
          }
        })()
      : null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatbotResponse {
  success: boolean;
  message: string;
  data?: {
    conversationId: string;
    responses: string[];
    suggestions?: string[];
    quickReplies?: string[];
    metadata?: Record<string, any>;
    transcription?: string;
    imageAnalysis?: string;
  };
  timestamp: string;
}

export interface ConversationData {
  conversationId: string | null;
  messages: ChatMessage[];
  language: string;
  status: string;
  suggestions?: string[];
  quickReplies?: string[];
}

// Send a message to the chatbot
export const sendChatbotMessage = async (
  message: string,
  language: string = 'en',
  conversationId?: string,
): Promise<ChatbotResponse> => {
  try {
    const res = await api.post('message', {
      message,
      language,
      conversationId,
    });
    if (res.status === 200 || res.status === 201) {
      return res.data;
    }
    return { success: false, message: 'Failed to send message', timestamp: new Date().toISOString() };
  } catch (error: any) {
    console.error('Chatbot message error:', error?.response?.data?.message);
    return {
      success: false,
      message: error?.response?.data?.message || 'Error sending message',
      timestamp: new Date().toISOString(),
    };
  }
};

// Process a quick command
export const processQuickCommand = async (
  command: string,
  language: string = 'en',
): Promise<ChatbotResponse> => {
  try {
    const res = await api.post('quick-command', {
      command,
      language,
    });
    if (res.status === 200) {
      return res.data;
    }
    return { success: false, message: 'Failed to process command', timestamp: new Date().toISOString() };
  } catch (error: any) {
    console.error('Quick command error:', error?.response?.data?.message);
    return {
      success: false,
      message: error?.response?.data?.message || 'Error processing command',
      timestamp: new Date().toISOString(),
    };
  }
};

// Send voice message for transcription and processing
export const sendVoiceMessage = async (
  audioBlob: Blob,
  language: string = 'en',
): Promise<ChatbotResponse> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.webm');
    formData.append('language', language);

    const res = await api.post('voice', formData);
    if (res.status === 200) {
      return res.data;
    }
    return { success: false, message: 'Failed to process voice message', timestamp: new Date().toISOString() };
  } catch (error: any) {
    console.error('Voice message error:', error?.response?.data?.message);
    return {
      success: false,
      message: error?.response?.data?.message || 'Error processing voice message',
      timestamp: new Date().toISOString(),
    };
  }
};

// Send image for analysis
export const sendImageForAnalysis = async (
  imageFile: File,
  language: string = 'en',
): Promise<ChatbotResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('language', language);

    const res = await api.post('analyze-image', formData);
    if (res.status === 200) {
      return res.data;
    }
    return { success: false, message: 'Failed to analyze image', timestamp: new Date().toISOString() };
  } catch (error: any) {
    console.error('Image analysis error:', error?.response?.data?.message);
    return {
      success: false,
      message: error?.response?.data?.message || 'Error analyzing image',
      timestamp: new Date().toISOString(),
    };
  }
};

// Get conversation history
export const getChatbotConversation = async (
  conversationId?: string,
  limit?: number,
): Promise<{ success: boolean; data?: ConversationData }> => {
  try {
    const params: Record<string, string> = {};
    if (conversationId) params.conversationId = conversationId;
    if (limit) params.limit = limit.toString();

    const res = await api.get('conversation', { params });
    if (res.status === 200) {
      return res.data;
    }
    return { success: false };
  } catch (error: any) {
    console.error('Get conversation error:', error?.response?.data?.message);
    return { success: false };
  }
};

// Get all conversations
export const getChatbotConversations = async (
  limit: number = 10,
): Promise<{ success: boolean; data?: any[] }> => {
  try {
    const res = await api.get('conversations', {
      params: { limit },
    });
    if (res.status === 200) {
      return res.data;
    }
    return { success: false };
  } catch (error: any) {
    console.error('Get conversations error:', error?.response?.data?.message);
    return { success: false };
  }
};

// Submit feedback
export const submitChatbotFeedback = async (
  conversationId: string,
  messageId: string,
  feedback: 'positive' | 'negative',
  comment?: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post('feedback', {
      conversationId,
      messageId,
      feedback,
      comment,
    });
    if (res.status === 200) {
      return res.data;
    }
    return { success: false, message: 'Failed to submit feedback' };
  } catch (error: any) {
    console.error('Feedback error:', error?.response?.data?.message);
    return {
      success: false,
      message: error?.response?.data?.message || 'Error submitting feedback',
    };
  }
};

// Get suggested questions
export const getSuggestedQuestions = async (
  language: string = 'en',
): Promise<{ success: boolean; data?: { questions: string[] } }> => {
  try {
    const res = await api.get('suggestions', {
      params: { language },
    });
    if (res.status === 200) {
      return res.data;
    }
    return { success: false };
  } catch (error: any) {
    console.error('Get suggestions error:', error?.response?.data?.message);
    return { success: false };
  }
};

// Delete a conversation
export const deleteChatbotConversation = async (
  conversationId: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.delete('conversation', {
      params: { conversationId },
    });
    if (res.status === 200) {
      return res.data;
    }
    return { success: false, message: 'Failed to delete conversation' };
  } catch (error: any) {
    console.error('Delete conversation error:', error?.response?.data?.message);
    return {
      success: false,
      message: error?.response?.data?.message || 'Error deleting conversation',
    };
  }
};
