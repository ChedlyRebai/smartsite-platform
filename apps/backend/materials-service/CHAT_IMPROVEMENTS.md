# Chat System Improvements

## Summary of Enhancements

This document outlines all the improvements made to the materials-service chat system.

## 1. AI-Powered Message Analysis

### Features
- Real-time message analysis using OpenAI GPT-4o-mini
- Detects sentiment, emotion, toxicity, and conflict levels
- Automatically suggests improved versions of problematic messages
- Context-aware for construction project communication

### Implementation
- **Service**: `ai-message-analyzer.service.ts`
- **Endpoint**: `POST /chat/analyze-message`
- **Configuration**: `OPENAI_API_KEY` in `.env`

### Usage
```typescript
// Analyze a message before sending
const response = await fetch('/chat/analyze-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Your message here",
    senderRole: "site" // or "supplier", "procurement"
  })
});

const { analysis } = await response.json();

if (analysis.status === 'CONFLICT') {
  // Block message, show improved version
  showWarning(analysis.ui_message);
  suggestMessage(analysis.improved_message);
} else if (analysis.status === 'WARNING') {
  // Allow send but suggest improvement
  showSuggestion(analysis.improved_message);
}
```

### Classification Levels

#### NORMAL
- Professional and respectful
- No intervention needed
- `allow_send: true`, `show_suggestion: false`

#### WARNING
- Shows frustration or stress
- Suggests improvement but allows sending
- `allow_send: true`, `show_suggestion: true`

#### CONFLICT
- Aggressive or disrespectful
- Blocks sending, requires improvement
- `allow_send: false`, `show_suggestion: true`

## 2. Emoji Support

### Features
- Send emoji-only messages
- React to messages with emojis
- Multiple users can react to the same message
- Real-time emoji reaction updates via WebSocket

### Implementation
- **Entity**: Added `reactions` and `reactionsByUser` fields to `ChatMessage`
- **Endpoints**: 
  - `POST /chat/reactions/add`
  - `POST /chat/reactions/remove`
- **WebSocket Events**: 
  - `addReaction` / `reactionAdded`
  - `removeReaction` / `reactionRemoved`

### Usage

#### REST API
```typescript
// Add reaction
await fetch('/chat/reactions/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messageId: 'msg_123',
    userId: 'user_456',
    emoji: '👍'
  })
});

// Remove reaction
await fetch('/chat/reactions/remove', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messageId: 'msg_123',
    userId: 'user_456'
  })
});
```

#### WebSocket
```typescript
// Add reaction
socket.emit('addReaction', {
  messageId: 'msg_123',
  userId: 'user_456',
  emoji: '👍',
  orderId: 'order_789'
});

// Listen for reactions
socket.on('reactionAdded', (data) => {
  updateMessageReactions(data.messageId, data.message.reactionsByUser);
});

socket.on('reactionRemoved', (data) => {
  updateMessageReactions(data.messageId, data.message.reactionsByUser);
});
```

### Recommended Emojis for Construction
- ✅ Done/Confirmed
- ⏳ In Progress
- 🚧 Under Construction
- 📦 Package/Delivery
- 🚚 Truck/Transport
- 📍 Location
- ⚠️ Warning
- ❌ Cancelled
- 👍 Thumbs Up
- 🙏 Thank You

## 3. Enhanced Message Types

### New Message Type
- `EMOJI`: For emoji-only messages

### Updated Entity
```typescript
export enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  IMAGE = 'image',
  DOCUMENT = 'document',
  LOCATION = 'location',
  ARRIVAL_CONFIRMATION = 'arrival_confirmation',
  CALL_REQUEST = 'call_request',
  CALL_ACCEPT = 'call_accept',
  CALL_REJECT = 'call_reject',
  CALL_END = 'call_end',
  STATUS_UPDATE = 'status_update',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  EMOJI = 'emoji', // NEW
}
```

## 4. Configuration

### Environment Variables
Add to `apps/backend/materials-service/.env`:
```env
# OpenAI API Configuration for Message Analysis
OPENAI_API_KEY=your_openai_api_key_here
```

### Dependencies
Already installed:
```json
{
  "openai": "^4.x.x"
}
```

## 5. Testing

### Test AI Analysis
```bash
cd apps/backend/materials-service
node test-ai-analysis.js
```

### Manual Testing

#### Test Message Analysis
```bash
curl -X POST http://localhost:3002/chat/analyze-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Où est ma livraison?! C'\''est inacceptable!",
    "senderRole": "site"
  }'
```

#### Test Emoji Reactions
```bash
# Add reaction
curl -X POST http://localhost:3002/chat/reactions/add \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "msg_123",
    "userId": "user_456",
    "emoji": "👍"
  }'

# Remove reaction
curl -X POST http://localhost:3002/chat/reactions/remove \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "msg_123",
    "userId": "user_456"
  }'
```

## 6. Frontend Integration Guide

### Step 1: Create AI Analysis Hook
```typescript
// hooks/useMessageAnalysis.ts
import { useState } from 'react';

export const useMessageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMessage = async (message: string, role: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:3002/chat/analyze-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, senderRole: role })
      });
      const { analysis } = await response.json();
      return analysis;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeMessage, isAnalyzing };
};
```

### Step 2: Integrate in Chat Component
```typescript
// components/ChatInput.tsx
import { useMessageAnalysis } from '../hooks/useMessageAnalysis';

export const ChatInput = ({ onSend, userRole }) => {
  const [message, setMessage] = useState('');
  const { analyzeMessage, isAnalyzing } = useMessageAnalysis();
  const [suggestion, setSuggestion] = useState(null);

  const handleSend = async () => {
    // Analyze message first
    const analysis = await analyzeMessage(message, userRole);

    if (analysis.status === 'CONFLICT') {
      // Block and show improved version
      alert(analysis.ui_message);
      setSuggestion(analysis.improved_message);
      return;
    }

    if (analysis.status === 'WARNING') {
      // Show suggestion
      const useImproved = confirm(
        `${analysis.ui_message}\n\nVersion améliorée: "${analysis.improved_message}"\n\nUtiliser la version améliorée ?`
      );
      if (useImproved) {
        onSend(analysis.improved_message);
      } else {
        onSend(message);
      }
    } else {
      // Send normally
      onSend(message);
    }

    setMessage('');
    setSuggestion(null);
  };

  return (
    <div>
      {suggestion && (
        <div className="suggestion-box">
          <p>💡 Suggestion: {suggestion}</p>
          <button onClick={() => setMessage(suggestion)}>
            Utiliser cette version
          </button>
        </div>
      )}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Votre message..."
      />
      <button onClick={handleSend} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyse...' : 'Envoyer'}
      </button>
    </div>
  );
};
```

### Step 3: Add Emoji Reactions
```typescript
// components/MessageReactions.tsx
export const MessageReactions = ({ message, currentUserId, socket }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji: string) => {
    socket.emit('addReaction', {
      messageId: message._id,
      userId: currentUserId,
      emoji,
      orderId: message.orderId
    });
    setShowPicker(false);
  };

  const handleRemoveReaction = () => {
    socket.emit('removeReaction', {
      messageId: message._id,
      userId: currentUserId,
      orderId: message.orderId
    });
  };

  const userReaction = message.reactionsByUser?.get(currentUserId);

  return (
    <div className="reactions">
      {/* Display existing reactions */}
      {Array.from(message.reactionsByUser || new Map()).map(([userId, emoji]) => (
        <span key={userId} className="reaction-badge">
          {emoji}
        </span>
      ))}

      {/* Add/Remove reaction button */}
      {userReaction ? (
        <button onClick={handleRemoveReaction}>❌</button>
      ) : (
        <button onClick={() => setShowPicker(!showPicker)}>➕ 😊</button>
      )}

      {/* Emoji picker */}
      {showPicker && (
        <EmojiPicker onSelect={handleReact} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
};
```

## 7. Performance Considerations

### AI Analysis
- **Latency**: ~500-1000ms per analysis
- **Cost**: ~$0.00015 per message (GPT-4o-mini)
- **Rate Limits**: 500 requests/minute (tier 1)

### Optimization Strategies
1. **Debounce**: Only analyze when user stops typing
2. **Cache**: Cache analysis for identical messages
3. **Async**: Don't block UI while analyzing
4. **Fallback**: Allow sending if AI is unavailable

### Caching Example
```typescript
const analysisCache = new Map<string, any>();

const analyzeWithCache = async (message: string, role: string) => {
  const cacheKey = `${message}:${role}`;
  
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }
  
  const analysis = await analyzeMessage(message, role);
  analysisCache.set(cacheKey, analysis);
  
  // Clear cache after 5 minutes
  setTimeout(() => analysisCache.delete(cacheKey), 5 * 60 * 1000);
  
  return analysis;
};
```

## 8. Monitoring & Analytics

### Metrics to Track
- Message analysis rate (NORMAL/WARNING/CONFLICT)
- User acceptance of suggestions
- Conflict prevention rate
- Emoji usage patterns
- Response times

### Logging
```typescript
// Log analysis results
logger.log({
  event: 'message_analyzed',
  status: analysis.status,
  sentiment: analysis.sentiment,
  emotion: analysis.emotion,
  conflict_level: analysis.conflict_level,
  user_role: senderRole,
  timestamp: new Date()
});
```

## 9. Security & Privacy

### Best Practices
1. **API Key Security**: Store in environment variables, never commit
2. **Data Privacy**: Messages are not stored by OpenAI (verify API settings)
3. **User Consent**: Inform users about AI analysis
4. **Anonymization**: Remove PII before analysis if needed
5. **GDPR Compliance**: Document data processing

### API Key Rotation
```bash
# Update .env with new key
OPENAI_API_KEY=new_key_here

# Restart service
npm run start:dev
```

## 10. Troubleshooting

### AI Analysis Not Working
```
⚠️ OpenAI API key not configured
```
**Solution**: Add `OPENAI_API_KEY` to `.env`

### Rate Limit Errors
```
❌ Rate limit exceeded
```
**Solution**: Implement request queuing or upgrade OpenAI tier

### Emoji Reactions Not Updating
**Solution**: Check WebSocket connection and event listeners

### False Positives in Analysis
**Solution**: Adjust system prompt or add more context

## 11. Future Enhancements

### Planned Features
1. **Multi-language Support**: French, Arabic analysis
2. **Custom Training**: Learn from team communication patterns
3. **Sentiment Trends**: Track communication health over time
4. **Proactive Alerts**: Notify managers of escalating conflicts
5. **Voice Message Analysis**: Analyze tone in voice messages
6. **GIF Support**: Allow GIF reactions
7. **Message Templates**: Quick professional responses

### Roadmap
- Q2 2026: Multi-language support
- Q3 2026: Custom training and learning
- Q4 2026: Advanced analytics dashboard

## 12. Documentation

### Additional Resources
- `AI_MESSAGE_ANALYSIS.md`: Detailed AI analysis documentation
- `EMOJI_GUIDE.md`: Emoji implementation guide
- `test-ai-analysis.js`: Testing script

### API Documentation
All endpoints are documented in the controller files with examples.

## 13. Support

For issues or questions:
1. Check logs: `npm run start:dev`
2. Test with curl commands
3. Verify environment variables
4. Check OpenAI API status
5. Review error messages in console

## Conclusion

These improvements significantly enhance the chat system with:
- ✅ AI-powered conflict prevention
- ✅ Professional communication suggestions
- ✅ Rich emoji support
- ✅ Real-time reactions
- ✅ Better user experience

The system is production-ready and can be deployed immediately.
