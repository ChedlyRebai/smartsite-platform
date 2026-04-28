# AI Message Analysis System

## Overview

This system uses OpenAI's GPT-4 to analyze messages in real-time for construction project communication, detecting potential conflicts and suggesting improvements.

## Features

### 1. Message Analysis
- **Sentiment Detection**: positive, neutral, negative
- **Emotion Recognition**: calm, stressed, frustrated, angry
- **Toxicity Level**: none, low, medium, high
- **Bad Words Detection**: true/false
- **Conflict Level**: none, low, medium, high
- **Escalation Risk**: low, medium, high

### 2. Message Classification
- **NORMAL**: Professional and respectful communication
- **WARNING**: Shows frustration or stress but no insults
- **CONFLICT**: Aggressive tone, blame, or disrespect

### 3. Message Improvement
- Automatically rewrites WARNING and CONFLICT messages
- Maintains original meaning while improving tone
- Removes aggression and inappropriate language
- Makes messages solution-oriented

### 4. UI Integration
- **NORMAL**: Allow send without suggestion
- **WARNING**: Allow send but show improved version
- **CONFLICT**: Block send, require improved version

## API Endpoints

### Analyze Message
```http
POST /chat/analyze-message
Content-Type: application/json

{
  "message": "Où est ma livraison?! C'est inacceptable!",
  "senderRole": "site"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "status": "WARNING",
    "sentiment": "negative",
    "emotion": "frustrated",
    "toxicity": "low",
    "bad_words": false,
    "conflict_level": "low",
    "escalation_risk": "medium",
    "allow_send": true,
    "show_suggestion": true,
    "improved_message": "Bonjour, pourriez-vous me donner une mise à jour sur l'état de ma livraison ? J'ai besoin de cette information pour planifier les prochaines étapes.",
    "ui_message": "Tension détectée. Voulez-vous envoyer une version améliorée ?",
    "confidence": 85,
    "explanation": "Message shows frustration but no direct insults"
  }
}
```

## Configuration

### Environment Variables
Add to `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Dependencies
```bash
npm install openai
```

## Usage Examples

### Frontend Integration

```typescript
// Before sending a message
const analyzeMessage = async (message: string, role: string) => {
  const response = await fetch('http://localhost:3002/chat/analyze-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, senderRole: role })
  });
  
  const { analysis } = await response.json();
  
  if (analysis.status === 'CONFLICT') {
    // Block sending, show improved message
    showImprovedMessageModal(analysis.improved_message);
    return false;
  } else if (analysis.status === 'WARNING') {
    // Show suggestion but allow sending
    showSuggestionDialog(analysis.improved_message);
    return true;
  }
  
  // NORMAL - send directly
  return true;
};
```

### Real-time Analysis with WebSocket

```typescript
socket.on('sendMessage', async (data) => {
  // Analyze before broadcasting
  const analysis = await aiAnalyzer.analyzeMessage(
    data.content,
    data.senderRole
  );
  
  if (analysis.status === 'CONFLICT') {
    socket.emit('messageBl ocked', {
      reason: analysis.ui_message,
      suggestion: analysis.improved_message
    });
    return;
  }
  
  // Broadcast message
  io.to(roomId).emit('newMessage', data);
});
```

## Emoji Support

### Features
- Send emoji-only messages
- React to messages with emojis
- Multiple users can react to the same message
- Real-time emoji reaction updates

### API Endpoints

#### Add Reaction
```http
POST /chat/reactions/add
Content-Type: application/json

{
  "messageId": "message_id",
  "userId": "user_id",
  "emoji": "👍"
}
```

#### Remove Reaction
```http
POST /chat/reactions/remove
Content-Type: application/json

{
  "messageId": "message_id",
  "userId": "user_id"
}
```

### WebSocket Events

#### Add Reaction
```typescript
socket.emit('addReaction', {
  messageId: 'msg_123',
  userId: 'user_456',
  emoji: '👍',
  orderId: 'order_789'
});

socket.on('reactionAdded', (data) => {
  console.log(`${data.userId} reacted with ${data.emoji}`);
});
```

#### Remove Reaction
```typescript
socket.emit('removeReaction', {
  messageId: 'msg_123',
  userId: 'user_456',
  orderId: 'order_789'
});

socket.on('reactionRemoved', (data) => {
  console.log(`${data.userId} removed reaction`);
});
```

## Context Awareness

The system understands construction project context:
- Moderate stress is acceptable
- Urgency is normal in construction
- Focuses on detecting actual conflicts, not just strong language
- Considers roles: Site Manager, Procurement Manager, Supplier

## Best Practices

1. **Always analyze before sending**: Prevent conflicts before they happen
2. **Show suggestions, don't force**: Let users decide whether to use improved messages
3. **Log analysis results**: Track communication patterns over time
4. **Respect privacy**: Don't store sensitive message content
5. **Handle API failures gracefully**: Fall back to allowing messages if AI is unavailable

## Monitoring

### Success Metrics
- Conflict prevention rate
- User acceptance of suggestions
- Reduction in escalated disputes
- Improved communication satisfaction

### Logging
```typescript
this.logger.log(`✅ Message analyzed: ${result.status}`);
this.logger.warn(`⚠️ WARNING message detected: ${message.substring(0, 50)}`);
this.logger.error(`❌ CONFLICT blocked: ${message.substring(0, 50)}`);
```

## Troubleshooting

### API Key Issues
```
⚠️ OpenAI API key not configured. AI message analysis will be disabled.
```
**Solution**: Add `OPENAI_API_KEY` to `.env` file

### Rate Limiting
If you hit OpenAI rate limits, implement:
- Request queuing
- Caching for similar messages
- Fallback to rule-based analysis

### False Positives
If the AI is too sensitive:
- Adjust the system prompt
- Lower the temperature parameter
- Add more construction-specific context

## Future Enhancements

1. **Multi-language Support**: Analyze messages in French, Arabic, etc.
2. **Learning from Feedback**: Train on accepted/rejected suggestions
3. **Team-specific Customization**: Adapt to team communication styles
4. **Sentiment Trends**: Track communication health over time
5. **Proactive Mediation**: Suggest breaks when tension is high

## Security Considerations

- API keys stored in environment variables
- Messages not logged or stored by OpenAI (check your API settings)
- Analysis results can be anonymized for reporting
- GDPR compliance: Users should consent to AI analysis

## Cost Estimation

Using GPT-4o-mini:
- ~$0.00015 per message analysis
- 1000 messages/day = ~$0.15/day = ~$4.50/month
- Very cost-effective for conflict prevention

## Support

For issues or questions:
1. Check logs for error messages
2. Verify OpenAI API key is valid
3. Test with simple messages first
4. Contact support with analysis results for debugging
