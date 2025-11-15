# WebSocket Persistent Connection - Quick Integration Guide

This guide shows the **minimal changes** needed to add persistent WebSocket connection to your existing frontend.

## Files You Need to Add

1. **`frontend/src/services/websocket/WebSocketService.ts`**
   - Copy this file from the current implementation
   - Main WebSocket client service that handles connection, reconnection, and authentication

2. **`frontend/src/types/websocket.types.ts`**
   - Copy this file if it doesn't exist
   - Contains `ConnectionStatus` enum used by WebSocketService

## Files You Need to Modify

### 1. `frontend/src/App.ts`

Add WebSocket connection on app initialization:

```typescript
import { LoginService } from './services/auth/LoginService';
import { webSocketService } from './services/websocket/WebSocketService';

export class App {
    // ... existing code ...

    mount(selector: string): void {
        // ... existing initialization code ...
        
        // Add this at the end
        this.initializeWebSocket();
    }

    private async initializeWebSocket(): Promise<void> {
        if (LoginService.isAuthenticated()) {
            try {
                if (!webSocketService.isConnected()) {
                    await webSocketService.connect();
                }
            } catch (error) {
                // Silently handle connection errors
            }
        }
    }
}
```

### 2. `frontend/src/pages/auth/LoginPage.ts`

Add WebSocket connection after successful login:

```typescript
import { webSocketService } from '../../services/websocket/WebSocketService';

// In your login handler method, after successful login:
if (response.accessToken) {
    // ... existing success handling ...
    
    // Add this:
    try {
        await webSocketService.connect();
    } catch (error) {
        // Silently handle connection errors
    }
    
    // ... rest of your code (redirect, etc.) ...
}
```

Do the same for:
- 2FA login success
- OAuth username setup completion

### 3. `frontend/src/pages/auth/OAuthCallbackPage.ts`

Add WebSocket connection for existing OAuth users:

```typescript
import { webSocketService } from '../../services/websocket/WebSocketService';

// In your OAuth callback handler:
private async handleCallback(): Promise<void> {
    // ... existing OAuth handling ...
    
    if (result.accessToken && result.refreshToken) {
        // Existing user - add this:
        try {
            await webSocketService.connect();
        } catch (error) {
            // Silently handle connection errors
        }
        
        window.location.replace('/profile');
    }
}
```

### 4. `frontend/src/services/auth/LoginService.ts`

Add WebSocket disconnection on logout:

```typescript
import { webSocketService } from '../websocket/WebSocketService';

// In your logout() method, in the finally block:
finally {
    // Add this before clearTokens():
    webSocketService.disconnect();
    
    this.clearTokens();
}
```

Do the same for `logoutAllDevices()` method.

## Configuration (Optional)

You can set a custom WebSocket URL via environment variable:

```bash
# .env or .env.local
VITE_WS_URL=ws://localhost:8080/ws
```

**If not set**, the service automatically uses the same hostname/port as your frontend with `/ws` path (e.g., if frontend is at `http://localhost:8080`, WebSocket will connect to `ws://localhost:8080/ws`).

## That's It!

After these changes:
- ✅ WebSocket connects automatically after login
- ✅ WebSocket reconnects on page reload if user is authenticated
- ✅ WebSocket disconnects on logout
- ✅ Connection persists across page navigation
- ✅ Automatic reconnection if connection drops

The WebSocket will automatically authenticate using the JWT token from `LoginService.getAccessToken()`.
