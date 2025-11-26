# Global WebSocket Handler - Usage Guide

The Global WebSocket Handler provides a centralized system for managing WebSocket events across the entire application. This is useful for features like chat notifications, friend status updates, and lobby invitations that need to work globally, not just in specific pages.

## Architecture

```
WebSocketService (singleton)
    ↓
GlobalWebSocketHandler (singleton) - Listens to all WS messages
    ↓
    ├─→ Chat Handlers (for global chat notifications)
    ├─→ Friend Status Handlers (for presence updates)
    ├─→ Notification Handlers (for system notifications)
    ├─→ Invitation Handlers (for game invitations)
    └─→ Generic Handlers (for logging, analytics)
```

## Quick Start

### 1. Basic Setup (Already configured in App.ts)

```typescript
import { globalWebSocketHandler } from '@/services/websocket/GlobalWebSocketHandler';

// Initialize once on app startup
globalWebSocketHandler.initialize();
```

### 2. Register Handlers

#### Chat Messages
```typescript
import { globalWebSocketHandler, ChatMessage } from '@/services/websocket/GlobalWebSocketHandler';

// Register a chat handler
const unsubscribe = globalWebSocketHandler.registerChatHandler((message: ChatMessage) => {
    console.log(`New chat from ${message.username}: ${message.message}`);
    
    // Show notification, update UI, play sound, etc.
    showChatNotification(message);
});

// Later, unsubscribe
unsubscribe();
```

#### Friend Status Updates
```typescript
import { globalWebSocketHandler, FriendStatusUpdate } from '@/services/websocket/GlobalWebSocketHandler';

const unsubscribe = globalWebSocketHandler.registerFriendStatusHandler((update: FriendStatusUpdate) => {
    console.log(`${update.username} is now ${update.status}`);
    
    // Update friend list UI
    updateFriendStatus(update.userId, update.status);
});
```

#### Lobby Invitations
```typescript
import { globalWebSocketHandler, LobbyInvitation } from '@/services/websocket/GlobalWebSocketHandler';

const unsubscribe = globalWebSocketHandler.registerInvitationHandler((invitation: LobbyInvitation) => {
    console.log(`Invitation from ${invitation.fromUsername} to join ${invitation.gameType}`);
    
    // Show invitation modal
    showInvitationModal(invitation);
});
```

#### Generic Handler (All Messages)
```typescript
const unsubscribe = globalWebSocketHandler.registerGenericHandler((type: string, payload: any) => {
    console.log(`[WS] ${type}:`, payload);
    
    // Log to analytics, debug console, etc.
    analytics.track('ws_message', { type, payload });
});
```

## Global Chat Notifications

The `GlobalChatNotifications` component automatically shows toast notifications for chat messages.

### Basic Usage
```typescript
import { globalChatNotifications } from '@/components/chat/GlobalChatNotifications';

// Already initialized in App.ts, but you can customize:
globalChatNotifications.initialize();

// Set current lobby to filter out messages from current context
globalChatNotifications.setCurrentLobby('12345678');

// When leaving lobby, clear filter
globalChatNotifications.setCurrentLobby(null);
```

### Custom Configuration
```typescript
import { GlobalChatNotifications } from '@/components/chat/GlobalChatNotifications';

const customNotifications = new GlobalChatNotifications({
    position: 'top-right',           // Notification position
    duration: 5000,                   // Auto-dismiss after 5 seconds
    maxVisible: 3,                    // Show max 3 notifications
    playSound: true,                  // Play sound on new message
    filterCurrentLobby: true,         // Don't show messages from current lobby
});

customNotifications.initialize();
```

## Integration with Pages

### Example: Pong Lobby Page

```typescript
import { globalChatNotifications } from '@/components/chat/GlobalChatNotifications';
import { globalWebSocketHandler } from '@/services/websocket/GlobalWebSocketHandler';

export default class PongLobbyPage extends BaseComponent {
    private lobbyId: string | null = null;
    
    async mount(): Promise<void> {
        // ... existing code ...
        
        // Tell global notifications to filter out messages from this lobby
        if (this.lobbyId) {
            globalChatNotifications.setCurrentLobby(this.lobbyId);
        }
        
        // Local handler for lobby-specific events
        webSocketService.on('lobby:chat', this.handleLocalChat);
    }
    
    dispose(): void {
        // Clear lobby filter
        globalChatNotifications.setCurrentLobby(null);
        
        // Clean up local handlers
        webSocketService.off('lobby:chat', this.handleLocalChat);
    }
}
```

## Message Types Handled

The global handler automatically routes these message types:

### Chat Messages
- `chat:message` - General chat message
- `lobby:chat` - Lobby chat message
- `channel:chat` - Channel chat message

### Friend Status
- `friend:status` - Friend status update
- `user:status` - User status update
- `presence:update` - Presence update

### Notifications
- `notification` - General notification
- `notification:new` - New notification

### Invitations
- `lobby:invitation` - Lobby invitation
- `game:invitation` - Game invitation
- `invitation:received` - Invitation received

## TypeScript Interfaces

### ChatMessage
```typescript
interface ChatMessage {
    id?: string;
    lobbyId?: string;
    channelId?: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    message: string;
    timestamp: number;
}
```

### FriendStatusUpdate
```typescript
interface FriendStatusUpdate {
    userId: string;
    username: string;
    status: 'online' | 'offline' | 'in-game' | 'in-lobby';
    gameType?: string;
    lobbyId?: string;
}
```

### Notification
```typescript
interface Notification {
    id: string;
    type: 'invitation' | 'friend_request' | 'game_started' | 'achievement' | 'system';
    title: string;
    message: string;
    timestamp: number;
    data?: any;
}
```

### LobbyInvitation
```typescript
interface LobbyInvitation {
    invitationId: string;
    lobbyId: string;
    gameType: string;
    fromUserId: string;
    fromUsername: string;
    fromAvatarUrl?: string;
    timestamp: number;
    expiresAt?: number;
}
```

## Best Practices

1. **Use Global Handlers for Cross-Page Features**
   - Chat notifications that should work everywhere
   - Friend status updates in the header
   - System notifications

2. **Use Local Handlers for Page-Specific Events**
   - Game state updates (only relevant in game page)
   - Lobby updates (only relevant in lobby page)

3. **Always Unsubscribe**
   ```typescript
   // Store unsubscribe function
   const unsubscribe = globalWebSocketHandler.registerChatHandler(handler);
   
   // Call when component unmounts
   unsubscribe();
   ```

4. **Filter Context-Specific Messages**
   ```typescript
   // Don't show notifications for messages from current lobby
   globalChatNotifications.setCurrentLobby(currentLobbyId);
   ```

5. **Combine Global and Local Handlers**
   ```typescript
   // Global: Show notifications for all chat
   globalWebSocketHandler.registerChatHandler(showNotification);
   
   // Local: Handle lobby chat in UI
   webSocketService.on('lobby:chat', updateChatUI);
   ```

## Example: Complete Chat Integration

```typescript
// components/chat/ChatManager.ts
export class ChatManager {
    private unsubscribers: (() => void)[] = [];
    
    initialize() {
        // Register global handler for all chat
        const unsub1 = globalWebSocketHandler.registerChatHandler((msg) => {
            this.handleGlobalChat(msg);
        });
        
        // Register notification handler
        const unsub2 = globalWebSocketHandler.registerNotificationHandler((notif) => {
            this.showNotification(notif);
        });
        
        this.unsubscribers.push(unsub1, unsub2);
    }
    
    handleGlobalChat(message: ChatMessage) {
        // Store in local database
        this.storeMessage(message);
        
        // Update unread count
        this.incrementUnreadCount(message.lobbyId || message.channelId);
    }
    
    cleanup() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }
}
```

## Debugging

Enable debug logging:
```typescript
// Register a generic handler for logging
globalWebSocketHandler.registerGenericHandler((type, payload) => {
    console.log(`[WS Debug] ${type}:`, payload);
});
```

Check if initialized:
```typescript
if (globalWebSocketHandler.isReady()) {
    console.log('Global handler is ready');
}
```
