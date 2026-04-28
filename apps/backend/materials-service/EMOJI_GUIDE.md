# Emoji Support Guide

## Overview

The chat system now supports full emoji functionality including:
- Sending emoji messages
- Reacting to messages with emojis
- Multiple reactions per message
- Real-time emoji updates

## Common Emojis for Construction Communication

### Status & Progress
- ✅ Done / Confirmed
- ⏳ In Progress / Waiting
- 🚧 Under Construction
- 📦 Package / Delivery
- 🚚 Truck / Transport
- 📍 Location
- ⚠️ Warning / Attention
- ❌ Cancelled / Problem
- 🔄 Updated / Changed

### Communication
- 👍 Thumbs Up / Agree
- 👎 Thumbs Down / Disagree
- 👌 OK / Perfect
- 🙏 Please / Thank You
- 💪 Strong / Capable
- 🤝 Agreement / Deal
- 👀 Looking / Checking
- 💬 Message / Comment
- 📞 Call / Phone

### Emotions
- 😊 Happy / Satisfied
- 😐 Neutral
- 😕 Confused / Unsure
- 😟 Worried / Concerned
- 😤 Frustrated
- 😡 Angry
- 🎉 Celebration / Success
- 🔥 Urgent / Hot

### Time & Schedule
- ⏰ Time / Clock
- 📅 Calendar / Date
- ⏱️ Timer / Countdown
- 🕐 Hour / Time
- 📆 Schedule

### Materials & Equipment
- 🏗️ Construction Site
- 🔨 Hammer / Tools
- 🔧 Wrench / Maintenance
- ⚙️ Settings / Configuration
- 📏 Measurement
- 🧱 Bricks / Materials
- 🪵 Wood / Lumber
- 🪨 Stone / Concrete

### Documents & Money
- 📄 Document
- 📋 Clipboard / Checklist
- 📊 Chart / Report
- 💰 Money / Payment
- 💳 Card / Transaction
- 💵 Cash / Bills
- 🧾 Receipt / Invoice

## Frontend Implementation

### Emoji Picker Component

```typescript
// EmojiPicker.tsx
import React from 'react';

const COMMON_EMOJIS = [
  '👍', '👎', '👌', '🙏', '💪', '🤝',
  '✅', '❌', '⏳', '🚧', '📦', '🚚',
  '😊', '😐', '😕', '😟', '😤', '😡',
  '⚠️', '📍', '🔄', '💬', '📞', '🎉'
];

export const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  return (
    <div className="emoji-picker">
      <div className="emoji-grid">
        {COMMON_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="emoji-button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Message Reactions Component

```typescript
// MessageReactions.tsx
import React from 'react';

interface Reaction {
  emoji: string;
  users: string[];
}

export const MessageReactions: React.FC<{
  reactions: Map<string, string>;
  currentUserId: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: () => void;
}> = ({ reactions, currentUserId, onAddReaction, onRemoveReaction }) => {
  // Group reactions by emoji
  const groupedReactions = new Map<string, string[]>();
  reactions.forEach((emoji, userId) => {
    if (!groupedReactions.has(emoji)) {
      groupedReactions.set(emoji, []);
    }
    groupedReactions.get(emoji)!.push(userId);
  });

  const userReaction = reactions.get(currentUserId);

  return (
    <div className="message-reactions">
      {Array.from(groupedReactions.entries()).map(([emoji, users]) => (
        <button
          key={emoji}
          className={`reaction-badge ${users.includes(currentUserId) ? 'active' : ''}`}
          onClick={() => {
            if (users.includes(currentUserId)) {
              onRemoveReaction();
            } else {
              onAddReaction(emoji);
            }
          }}
        >
          {emoji} {users.length}
        </button>
      ))}
      
      {!userReaction && (
        <button className="add-reaction-btn" onClick={() => {
          // Show emoji picker
        }}>
          + 😊
        </button>
      )}
    </div>
  );
};
```

### Chat Integration

```typescript
// ChatMessage.tsx
import React, { useState } from 'react';
import { MessageReactions } from './MessageReactions';
import { EmojiPicker } from './EmojiPicker';

export const ChatMessage: React.FC<{
  message: any;
  currentUserId: string;
  socket: any;
}> = ({ message, currentUserId, socket }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleAddReaction = (emoji: string) => {
    socket.emit('addReaction', {
      messageId: message._id,
      userId: currentUserId,
      emoji,
      orderId: message.orderId
    });
  };

  const handleRemoveReaction = () => {
    socket.emit('removeReaction', {
      messageId: message._id,
      userId: currentUserId,
      orderId: message.orderId
    });
  };

  return (
    <div className="chat-message">
      <div className="message-content">
        {message.content}
      </div>
      
      <MessageReactions
        reactions={message.reactionsByUser || new Map()}
        currentUserId={currentUserId}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
      />
      
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleAddReaction}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};
```

## CSS Styling

```css
/* Emoji Picker */
.emoji-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-width: 300px;
}

.emoji-button {
  font-size: 24px;
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.emoji-button:hover {
  background: #f0f0f0;
}

/* Message Reactions */
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.reaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: #f8f8f8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.reaction-badge:hover {
  background: #e8e8e8;
  transform: scale(1.05);
}

.reaction-badge.active {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #2196f3;
}

.add-reaction-btn {
  padding: 4px 8px;
  border: 1px dashed #ddd;
  border-radius: 12px;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.add-reaction-btn:hover {
  opacity: 1;
}
```

## WebSocket Event Handling

```typescript
// Setup emoji reaction listeners
socket.on('reactionAdded', (data) => {
  // Update message in state
  setMessages(prev => prev.map(msg => 
    msg._id === data.messageId 
      ? { ...msg, reactionsByUser: data.message.reactionsByUser }
      : msg
  ));
});

socket.on('reactionRemoved', (data) => {
  // Update message in state
  setMessages(prev => prev.map(msg => 
    msg._id === data.messageId 
      ? { ...msg, reactionsByUser: data.message.reactionsByUser }
      : msg
  ));
});
```

## Best Practices

1. **Limit Emoji Picker**: Show only relevant emojis for construction context
2. **One Reaction Per User**: Users can only have one reaction per message
3. **Real-time Updates**: Use WebSocket for instant reaction updates
4. **Accessibility**: Add aria-labels for screen readers
5. **Mobile Friendly**: Ensure emoji picker works on touch devices
6. **Performance**: Don't load all emojis, use a curated list

## Emoji in Message Content

Users can also type emojis directly in messages:
- Native emoji keyboard (Windows: Win + .)
- Copy-paste from emoji websites
- Emoji shortcuts (if implemented)

## Analytics

Track emoji usage to understand:
- Most used emojis
- Sentiment trends (positive vs negative emojis)
- Communication patterns
- User engagement

## Accessibility

```typescript
<button
  className="emoji-button"
  aria-label={`React with ${emoji}`}
  role="button"
  tabIndex={0}
>
  {emoji}
</button>
```

## Mobile Considerations

```css
@media (max-width: 768px) {
  .emoji-grid {
    grid-template-columns: repeat(8, 1fr);
  }
  
  .emoji-button {
    font-size: 28px;
    padding: 12px;
  }
}
```

## Testing

```typescript
// Test emoji reactions
describe('Emoji Reactions', () => {
  it('should add reaction to message', async () => {
    const response = await fetch('/chat/reactions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: 'msg_123',
        userId: 'user_456',
        emoji: '👍'
      })
    });
    
    expect(response.ok).toBe(true);
  });
  
  it('should remove reaction from message', async () => {
    const response = await fetch('/chat/reactions/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: 'msg_123',
        userId: 'user_456'
      })
    });
    
    expect(response.ok).toBe(true);
  });
});
```
