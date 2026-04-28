import React from 'react';
import { Badge } from '../ui/badge';
import messageAnalysisService, { MessageAnalysisResult } from '../../services/messageAnalysisService';

interface MessageAnalysisDisplayProps {
  analysis: {
    emotion: string;
    sentiment: string;
    confidence: number;
    status: string;
  };
  isOwnMessage?: boolean;
}

export default function MessageAnalysisDisplay({ analysis, isOwnMessage = false }: MessageAnalysisDisplayProps) {
  if (!analysis) return null;

  const emotionIcon = messageAnalysisService.getEmotionIcon(analysis.emotion);
  const emotionColor = messageAnalysisService.getEmotionColor(analysis.emotion);
  const sentimentIcon = messageAnalysisService.getSentimentIcon(analysis.sentiment);

  return (
    <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Emotion indicator */}
      <div 
        className={`flex items-center gap-1 text-xs ${emotionColor}`}
        title={`Émotion: ${analysis.emotion} (${analysis.confidence}% confiance)`}
      >
        <span className="text-sm">{emotionIcon}</span>
        <span className="hidden sm:inline capitalize">{analysis.emotion}</span>
      </div>
      
      {/* Sentiment indicator */}
      <div 
        className="flex items-center gap-1 text-xs text-gray-500"
        title={`Sentiment: ${analysis.sentiment}`}
      >
        <span className="text-sm">{sentimentIcon}</span>
      </div>

      {/* Status badge for non-normal messages */}
      {analysis.status !== 'NORMAL' && (
        <Badge 
          className={`text-xs px-1 py-0 ${messageAnalysisService.getStatusColor(analysis.status)}`}
          title={`Statut: ${analysis.status}`}
        >
          {analysis.status === 'WARNING' ? '⚠️' : analysis.status === 'CONFLICT' ? '🚫' : ''}
        </Badge>
      )}
    </div>
  );
}