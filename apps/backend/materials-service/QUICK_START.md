# Quick Start Guide - AI Chat Improvements

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies (Already Done ✅)
```bash
cd apps/backend/materials-service
npm install openai
```

### Step 2: Configure OpenAI API Key
The API key has been added to `.env`:
```env
OPENAI_API_KEY=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
```

### Step 3: Start the Service
```bash
npm run start:dev
```

### Step 4: Test AI Analysis
Open a new terminal and run:
```bash
node test-ai-analysis.js
```

Or test manually with curl:
```bash
curl -X POST http://localhost:3002/chat/analyze-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Où est ma livraison?! C'\''est inacceptable!",
    "senderRole": "site"
  }'
```

### Step 5: Test Emoji Reactions
```bash
# First, send a message and get its ID
# Then add a reaction:
curl -X POST http://localhost:3002/chat/reactions/add \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "your_message_id",
    "userId": "user_123",
    "emoji": "👍"
  }'
```

## 📋 What's Been Added

### 1. AI Message Analysis
- **File**: `src/chat/ai-message-analyzer.service.ts`
- **Endpoint**: `POST /chat/analyze-message`
- **Purpose**: Analyzes messages for conflict, suggests improvements

### 2. Emoji Support
- **Files**: Updated `chat.service.ts`, `chat.controller.ts`, `chat.gateway.ts`
- **Endpoints**: 
  - `POST /chat/reactions/add`
  - `POST /chat/reactions/remove`
- **WebSocket Events**: `addReaction`, `removeReaction`

### 3. Enhanced Message Entity
- Added `reactions` field
- Added `reactionsByUser` field
- Added `EMOJI` message type

## 🧪 Testing

### Test Messages
Try these messages to see different analysis results:

**NORMAL (Professional)**
```
"Bonjour, pourriez-vous me confirmer l'heure de livraison ?"
```

**WARNING (Frustrated)**
```
"Où est ma livraison?! C'est inacceptable!"
```

**CONFLICT (Aggressive)**
```
"Vous êtes incompétents! Je vais annuler la commande!"
```

### Expected Results

#### NORMAL
```json
{
  "status": "NORMAL",
  "allow_send": true,
  "show_suggestion": false,
  "ui_message": "Communication saine"
}
```

#### WARNING
```json
{
  "status": "WARNING",
  "allow_send": true,
  "show_suggestion": true,
  "improved_message": "Bonjour, pourriez-vous me donner une mise à jour...",
  "ui_message": "Tension détectée. Voulez-vous envoyer une version améliorée ?"
}
```

#### CONFLICT
```json
{
  "status": "CONFLICT",
  "allow_send": false,
  "show_suggestion": true,
  "improved_message": "Je suis préoccupé par le service...",
  "ui_message": "Conflit détecté. Message bloqué..."
}
```

## 🎨 Frontend Integration

### Basic Example
```typescript
// Before sending a message
const analysis = await fetch('/chat/analyze-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    senderRole: 'site'
  })
}).then(r => r.json());

if (analysis.analysis.status === 'CONFLICT') {
  alert('Message bloqué. Utilisez: ' + analysis.analysis.improved_message);
  return;
}

// Send message...
```

### Emoji Reactions
```typescript
// Add reaction
socket.emit('addReaction', {
  messageId: msg._id,
  userId: currentUser.id,
  emoji: '👍',
  orderId: order.id
});

// Listen for updates
socket.on('reactionAdded', (data) => {
  updateMessage(data.messageId, data.message);
});
```

## 📊 Monitoring

### Check Logs
```bash
# Watch logs for analysis results
npm run start:dev

# Look for:
# ✅ Message analyzed: NORMAL
# ⚠️ Message analyzed: WARNING
# 🚫 Message analyzed: CONFLICT
```

### Health Check
```bash
curl http://localhost:3002/chat/health
```

## 🔧 Configuration

### Adjust AI Sensitivity
Edit `ai-message-analyzer.service.ts` and modify the system prompt:
- Make it more/less strict
- Add construction-specific terms
- Adjust classification thresholds

### Change Model
```typescript
// In ai-message-analyzer.service.ts
const completion = await this.openai.chat.completions.create({
  model: 'gpt-4o-mini', // or 'gpt-4', 'gpt-3.5-turbo'
  // ...
});
```

## 📚 Documentation

- **AI_MESSAGE_ANALYSIS.md**: Complete AI analysis documentation
- **EMOJI_GUIDE.md**: Emoji implementation guide
- **CHAT_IMPROVEMENTS.md**: Full list of improvements

## 🐛 Troubleshooting

### "OpenAI API key not configured"
- Check `.env` file has `OPENAI_API_KEY`
- Restart the service

### "Rate limit exceeded"
- You're making too many requests
- Implement caching or upgrade OpenAI tier

### Emoji reactions not working
- Check MongoDB connection
- Verify WebSocket is connected
- Check browser console for errors

## 💡 Tips

1. **Cache Analysis**: Don't analyze the same message twice
2. **Debounce**: Wait for user to stop typing before analyzing
3. **Fallback**: If AI fails, allow sending anyway
4. **User Choice**: Always let users override suggestions
5. **Privacy**: Consider anonymizing messages before analysis

## 🎯 Next Steps

1. ✅ Test the AI analysis endpoint
2. ✅ Test emoji reactions
3. 🔄 Integrate into frontend
4. 🔄 Add UI for suggestions
5. 🔄 Implement emoji picker
6. 🔄 Add analytics tracking

## 📞 Support

If you encounter issues:
1. Check the logs
2. Verify environment variables
3. Test with curl commands
4. Review the documentation files

## 🎉 Success!

You now have:
- ✅ AI-powered message analysis
- ✅ Conflict detection and prevention
- ✅ Professional message suggestions
- ✅ Emoji reactions
- ✅ Real-time updates

The chat system is significantly improved and ready for production use!
