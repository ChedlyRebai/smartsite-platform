import axios from 'axios';

export interface MessageAnalysisResult {
  status: 'NORMAL' | 'WARNING' | 'CONFLICT';
  sentiment: 'positive' | 'neutral' | 'negative';
  emotion: 'calm' | 'stressed' | 'frustrated' | 'angry';
  toxicity: 'none' | 'low' | 'medium' | 'high';
  bad_words: boolean;
  conflict_level: 'none' | 'low' | 'medium' | 'high';
  escalation_risk: 'low' | 'medium' | 'high';
  allow_send: boolean;
  show_suggestion: boolean;
  improved_message: string;
  ui_message: string;
  confidence: number;
  explanation: string;
}

const API_URL = '/api/chat';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const messageAnalysisService = {
  async analyzeMessage(message: string, senderRole: string): Promise<MessageAnalysisResult | null> {
    try {
      const response = await apiClient.post('/analyze-message', {
        message,
        senderRole,
      });
      
      if (response.data.success) {
        return response.data.analysis;
      }
      return null;
    } catch (error) {
      console.error('Error analyzing message:', error);
      return null;
    }
  },

  getEmotionIcon(emotion: string): string {
    switch (emotion) {
      case 'calm': return '😌';
      case 'stressed': return '😰';
      case 'frustrated': return '😤';
      case 'angry': return '😡';
      default: return '😐';
    }
  },

  getEmotionColor(emotion: string): string {
    switch (emotion) {
      case 'calm': return 'text-green-600';
      case 'stressed': return 'text-yellow-600';
      case 'frustrated': return 'text-orange-600';
      case 'angry': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  getSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '👍';
      case 'negative': return '👎';
      case 'neutral': return '👌';
      default: return '🤷';
    }
  },

  getStatusColor(status: string): string {
    switch (status) {
      case 'NORMAL': return 'bg-green-100 text-green-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFLICT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },
};

export default messageAnalysisService;