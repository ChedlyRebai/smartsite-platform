import React from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, X, AlertTriangle } from 'lucide-react';
import { MessageAnalysisResult } from '../../services/messageAnalysisService';

interface MessageSuggestionProps {
  analysis: MessageAnalysisResult;
  onAcceptSuggestion: (improvedMessage: string) => void;
  onDismiss: () => void;
  onSendOriginal: () => void;
}

export default function MessageSuggestion({ 
  analysis, 
  onAcceptSuggestion, 
  onDismiss, 
  onSendOriginal 
}: MessageSuggestionProps) {
  if (!analysis.show_suggestion) return null;

  const getAlertVariant = () => {
    switch (analysis.status) {
      case 'WARNING': return 'default';
      case 'CONFLICT': return 'destructive';
      default: return 'default';
    }
  };

  const getIcon = () => {
    switch (analysis.status) {
      case 'WARNING': return <AlertTriangle className="h-4 w-4" />;
      case 'CONFLICT': return <X className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Alert className={`mb-3 ${analysis.status === 'CONFLICT' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1">
          <AlertDescription className="text-sm">
            <div className="font-medium mb-2">{analysis.ui_message}</div>
            
            {analysis.improved_message && analysis.improved_message !== analysis.explanation && (
              <div className="bg-white rounded-md p-2 border border-gray-200 mb-3">
                <div className="text-xs text-gray-500 mb-1">💡 Suggestion :</div>
                <div className="text-sm text-gray-800 italic">"{analysis.improved_message}"</div>
              </div>
            )}
            
            <div className="flex gap-2 mt-2">
              {analysis.allow_send && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAcceptSuggestion(analysis.improved_message)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7"
                  >
                    ✅ Utiliser la suggestion
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSendOriginal}
                    className="text-xs px-3 py-1 h-7"
                  >
                    📤 Envoyer quand même
                  </Button>
                </>
              )}
              {!analysis.allow_send && (
                <Button
                  size="sm"
                  onClick={() => onAcceptSuggestion(analysis.improved_message)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7"
                >
                  ✏️ Modifier le message
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-xs px-2 py-1 h-7"
              >
                ❌
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}