# WebSocket Frontend Integration Guide

This document explains how to integrate the WebSocket client into your frontend application based on the current implementation.

## Overview

The WebSocket client is implemented as a singleton service that automatically connects when the user is authenticated. It handles reconnection, authentication, and event management.

## File Structure

The WebSocket integration consists of:

```
frontend/src/
├── services/
│   └── websocket/
│       ├── WebSocketService.ts    # Main WebSocket client service
│       ├── LobbyService.ts        # Lobby management service (uses WebSocket)
│       └── OnlineFriendsService.ts # Online friends service (uses WebSocket)
├── types/
│   └── websocket.types.ts         # WebSocket type definitions
└── App.ts                         # Application initialization (connects WebSocket)
```

## Configuration

### Environment Variables

Set the WebSocket server URL in your frontend environment:

```bash
# .env or .env.local
VITE_WS_URL=ws://localhost:3005/ws
```

**Production example:**
```bash
VITE_WS_URL=wss://your-domain.com/ws
```

### Default Configuration

- **Default URL**: `ws://localhost:8080/ws`
- **Connection Timeout**: 10 seconds
- **Reconnection Attempts**: 3 max attempts
- **Reconnection Interval**: 2 seconds (exponential backoff)

## Authentication

The WebSocket connection requires a JWT access token. The service automatically retrieves the token from `LoginService.getAccessToken()`.

### Token Storage

The token should be stored in `localStorage` with the key `access_token`:

```typescript
localStorage.setItem('access_token', token);
```

The `LoginService` handles token management automatically.

## Usage

### 1. Import the Service

```typescript
import { webSocketService } from './services/websocket/WebSocketService';
```

### 2. Automatic Connection

The WebSocket automatically connects when:
- User logs in (handled in `LoginPage.ts`)
- User authenticates via OAuth (handled in `OAuthCallbackPage.ts`)
- Application loads and user is already authenticated (handled in `App.ts`)

**You don't need to manually call `connect()` in most cases.**

### 3. Manual Connection (if needed)

```typescript
try {
  await webSocketService.connect();
  console.log('WebSocket connected');
} catch (error) {
  console.error('Failed to connect:', error);
}
```

### 4. Check Connection Status

```typescript
if (webSocketService.isConnected()) {
  // WebSocket is connected
}

const status = webSocketService.getStatus();
// Returns: DISCONNECTED | CONNECTING | CONNECTED | RECONNECTING | ERROR
```

### 5. Disconnect

```typescript
webSocketService.disconnect();
```

## Event System

The WebSocket service uses a dual event system:

### 1. Listener System (Recommended)

Register listeners for specific events:

```typescript
// Listen to lobby updates
webSocketService.onLobbyUpdate(lobbyId, (lobby: Lobby) => {
  console.log('Lobby updated:', lobby);
});

// Listen to player joins
webSocketService.onPlayerJoin(lobbyId, (player: any) => {
  console.log('Player joined:', player);
});

// Listen to player leaves
webSocketService.onPlayerLeave(lobbyId, (playerId: string) => {
  console.log('Player left:', playerId);
});

// Listen to invitations
webSocketService.onInvitationReceived((invitation: LobbyInvitation) => {
  console.log('Invitation received:', invitation);
});

// Listen to chat messages
webSocketService.onChatMessage(lobbyId, (message: LobbyChatMessage) => {
  console.log('Chat message:', message);
});

// Listen to friend status updates
webSocketService.subscribeFriendsStatus((userId: string, status: string) => {
  console.log('Friend status:', userId, status);
});
```

### 2. Window Events (Alternative)

Listen to global window events:

```typescript
window.addEventListener('ws:connected', () => {
  console.log('WebSocket connected');
});

window.addEventListener('ws:disconnected', () => {
  console.log('WebSocket disconnected');
});

window.addEventListener('ws:error', (event: any) => {
  console.error('WebSocket error:', event.detail);
});

// Listen to specific message types
window.addEventListener('ws:lobby:update', (event: any) => {
  const lobby = event.detail;
  console.log('Lobby updated:', lobby);
});
```

## Sending Messages

### Lobby Operations

```typescript
// Create a lobby
const lobbyId = await webSocketService.createLobby('pong', 4);

// Join a lobby
await webSocketService.joinLobby(lobbyId);

// Leave a lobby
await webSocketService.leaveLobby(lobbyId);

// Update ready status
await webSocketService.updateReadyStatus(lobbyId, true);

// Update customization
await webSocketService.updateCustomization(lobbyId, customizationData);

// Send chat message
await webSocketService.sendChatMessage(lobbyId, 'Hello!');

// Send invitation
await webSocketService.sendInvitation(lobbyId, friendUserId);

// Accept invitation
await webSocketService.acceptInvitation(invitationId);

// Decline invitation
await webSocketService.declineInvitation(invitationId);
```

### Low-level Message Sending

The service handles message formatting internally. Messages are sent as:

```json
{
  "type": "event:type",
  "payload": { /* data */ },
  "timestamp": 1234567890
}
```

## Reconnection

The WebSocket automatically reconnects when:
- Connection is lost
- Connection is closed unexpectedly
- Network error occurs

**Reconnection behavior:**
- Maximum 3 attempts
- 2-second interval between attempts
- Automatically stops after max attempts
- Reconnects with fresh token from `LoginService`

## Integration with Existing Services

### LobbyService

The `LobbyService` already uses `webSocketService`:

```typescript
import { webSocketService } from './WebSocketService';
import LobbyService from './LobbyService';

// LobbyService automatically manages WebSocket connection
const lobby = await LobbyService.createLobby('pong', 4);
await LobbyService.joinLobby(lobbyId);
await LobbyService.leaveLobby();
```

### OnlineFriendsService

The `OnlineFriendsService` uses WebSocket for friend status:

```typescript
import OnlineFriendsService from './OnlineFriendsService';

// Initialize and subscribe to friend status updates
await OnlineFriendsService.initialize();

// Get online friends
const friends = OnlineFriendsService.getOnlineFriends();
```

## Error Handling

The service handles errors gracefully:

```typescript
try {
  await webSocketService.connect();
} catch (error) {
  // Handle connection error
  if (error.message === 'No access token available') {
    // User needs to login first
  }
}
```

## Example: Complete Integration

```typescript
// In your component or service
import { webSocketService } from '../services/websocket/WebSocketService';
import { LoginService } from '../services/auth/LoginService';

class MyComponent {
  async init() {
    // Check if user is authenticated
    if (LoginService.isAuthenticated()) {
      // Connect if not already connected
      if (!webSocketService.isConnected()) {
        try {
          await webSocketService.connect();
          console.log('WebSocket connected');
        } catch (error) {
          console.error('Failed to connect WebSocket:', error);
        }
      }

      // Subscribe to events
      webSocketService.onLobbyUpdate('lobby-123', (lobby) => {
        // Handle lobby update
      });

      webSocketService.subscribeFriendsStatus((userId, status) => {
        // Handle friend status change
      });
    }
  }

  cleanup() {
    // Unsubscribe if needed
    webSocketService.unsubscribeFriendsStatus();
    webSocketService.unsubscribeLobby('lobby-123');
  }
}
```

## Type Definitions

All types are defined in `frontend/src/types/websocket.types.ts`:

```typescript
import { 
  WSEventType, 
  ConnectionStatus, 
  WSMessage 
} from '../types/websocket.types';
```

## Troubleshooting

### Connection Not Established

1. Check if `VITE_WS_URL` is set correctly
2. Verify the token exists: `LoginService.getAccessToken()`
3. Check browser console for connection errors
4. Verify WebSocket server is running and accessible

### Reconnection Issues

1. Check network connectivity
2. Verify token is still valid
3. Check server logs for authentication errors

### Events Not Received

1. Ensure listeners are registered before connecting
2. Check event type names match server events
3. Verify you're subscribed to the correct room/lobby

## Best Practices

1. **Don't connect manually** - Let the service handle automatic connection
2. **Register listeners before connecting** - Or check connection status first
3. **Clean up listeners** - Unsubscribe when component unmounts
4. **Handle errors gracefully** - Network issues can occur anytime
5. **Check connection status** - Before sending critical messages

## Next Steps

1. Copy `frontend/src/services/websocket/WebSocketService.ts` to your project
2. Copy `frontend/src/types/websocket.types.ts` to your project
3. Ensure `LoginService` is available with `getAccessToken()` method
4. Set `VITE_WS_URL` environment variable
5. Initialize WebSocket in your app initialization (like `App.ts`)
6. Add WebSocket connection calls after login (like `LoginPage.ts`)

## Support

For issues or questions, refer to:
- WebSocket Service README: `services/websocket/README.md`
- WebSocket API Documentation: `docs/api/websocket.md`
