# Notification System - Quick Start Guide

## For Developers

### Overview
The notification system automatically handles all notifications in the app. Just make sure the backend sends the correct WebSocket messages and everything works automatically!

## Setup (Already Done!)

The notification system is initialized automatically in `App.ts`:

```typescript
// Already initialized in App.ts
notificationManager.initialize();
```

The bell icon appears automatically in the header when users are logged in.

## How It Works

### 1. Backend sends notification → Frontend receives → User sees it

**Example Flow**:
```
Backend sends:
{
    type: 'lobby:invitation',
    payload: { invitationId: 'inv123', fromUsername: 'Alice', ... }
}
    ↓
GlobalWebSocketHandler routes to NotificationManager
    ↓
NotificationPanel shows in dropdown
    ↓
QuickToast shows popup (3s, high-priority only)
    ↓
User clicks "Accept" or "Decline"
    ↓
Frontend sends response:
{
    type: 'lobby:invitation:response',
    payload: { invitationId: 'inv123', action: 'accept' }
}
```

## Notification Types

### 1. Chat Messages (1-1 DMs only)
**Priority**: Normal (no toast popup)
**WebSocket Type**: `chat:message`
**Appears In**: Notification panel only

```typescript
// Backend sends:
{
    type: 'chat:message',
    payload: {
        id: 'msg123',
        userId: 'user456',
        username: 'Alice',
        avatarUrl: 'https://...',
        message: 'Hello!',
        timestamp: Date.now()
    }
}
```

### 2. Lobby Invitations
**Priority**: High (shows toast popup)
**WebSocket Type**: `lobby:invitation`
**Appears In**: Notification panel + toast popup

```typescript
// Backend sends:
{
    type: 'lobby:invitation',
    payload: {
        invitationId: 'inv123',
        lobbyId: 'lobby456',
        gameType: 'pong',
        fromUserId: 'user789',
        fromUsername: 'Bob',
        fromAvatarUrl: 'https://...',
        timestamp: Date.now(),
        expiresAt: Date.now() + 300000  // 5 minutes
    }
}

// Frontend responds (on user action):
{
    type: 'lobby:invitation:response',
    payload: {
        invitationId: 'inv123',
        action: 'accept',  // or 'decline'
        lobbyId: 'lobby456'
    }
}
```

### 3. Friend Requests
**Priority**: High (shows toast popup)
**WebSocket Type**: `notification:new`
**Appears In**: Notification panel + toast popup

```typescript
// Backend sends:
{
    type: 'notification:new',
    payload: {
        id: 'notif123',
        type: 'friend_request',
        title: 'New Friend Request',
        message: 'Charlie wants to be your friend',
        timestamp: Date.now(),
        data: {
            userId: 'user999',
            username: 'Charlie'
        }
    }
}

// Frontend responds (on user action):
{
    type: 'friend:request:response',
    payload: {
        userId: 'user999',
        action: 'accept'  // or 'decline'
    }
}
```

## Using the NotificationManager

### Get Current Notifications

```typescript
import { notificationManager } from '@/services/notifications/NotificationManager';

// Get all notifications
const notifications = notificationManager.getAll();

// Get unread count
const unreadCount = notificationManager.getUnreadCount();
```

### Subscribe to Changes

```typescript
import { notificationManager } from '@/services/notifications/NotificationManager';

// Subscribe to notification updates
const unsubscribe = notificationManager.subscribe(notifications => {
    console.log('Notifications:', notifications);
});

// Subscribe to unread count
const unsubscribeCount = notificationManager.subscribeToUnreadCount(count => {
    console.log('Unread:', count);
});

// Clean up when done
unsubscribe();
unsubscribeCount();
```

### Manual Actions

```typescript
import { notificationManager } from '@/services/notifications/NotificationManager';

// Mark as read
notificationManager.markAsRead('notif123');

// Mark all as read
notificationManager.markAllAsRead();

// Clear all
notificationManager.clearAll();

// Handle invitation action (usually automatic from UI)
await notificationManager.handleInvitationAction('inv123', 'accept');

// Handle friend request action (usually automatic from UI)
await notificationManager.handleFriendRequestAction('notif123', 'decline');
```

## Testing Locally

### Option 1: Mock WebSocket Messages

```typescript
// In browser console:
import { globalWebSocketHandler } from './services/websocket/GlobalWebSocketHandler';

// Trigger a test notification
globalWebSocketHandler.handleMessage({
    type: 'lobby:invitation',
    payload: {
        invitationId: 'test123',
        lobbyId: 'lobby123',
        gameType: 'pong',
        fromUserId: 'user123',
        fromUsername: 'TestUser',
        timestamp: Date.now(),
        expiresAt: Date.now() + 300000
    }
});
```

### Option 2: Use Chrome DevTools

1. Open DevTools → Network → WS tab
2. Find WebSocket connection
3. Right-click → Edit and Resend
4. Send test message

### Option 3: Backend Integration

Work with backend team to send real WebSocket messages.

## Troubleshooting

### "Bell icon not showing"
- Check if user is logged in (`localStorage.getItem('access_token')`)
- Verify Header component is mounted
- Check browser console for errors

### "Notifications not appearing"
- Verify WebSocket is connected (`webSocketService.isConnected()`)
- Check GlobalWebSocketHandler is initialized
- Check NotificationManager is initialized
- Verify backend is sending correct message format

### "Badge not updating"
- Check NotificationManager is subscribed to updates
- Verify `subscribeToUnreadCount()` is called in Header
- Check browser console for errors

### "Actions not working"
- Verify WebSocket is connected
- Check backend is handling response messages
- Verify notification data includes required fields

## Component Reference

### NotificationPanel
**Location**: Dropdown below bell icon
**Opens**: Click bell icon in header
**Closes**: Click outside, press Escape, or click bell again

Features:
- Scrollable list (max 400px height)
- Click notification to mark as read
- Action buttons for invitations/friend requests
- "Mark all as read" button
- "Clear all" button

### QuickToast
**Location**: Top-right (desktop), top-center (mobile)
**Duration**: 3 seconds (auto-dismiss)
**Shows For**: High-priority notifications only (invitations, friend requests)

Features:
- Click to dismiss
- Click to open notification panel
- Animated slide-in/out
- Shows user avatar if available

## FAQ

### Q: Can I disable toast popups?
A: Not currently. Future enhancement: Add user preferences.

### Q: Can I filter notifications by type?
A: Not currently. Future enhancement: Add category filtering.

### Q: How many notifications are stored?
A: Maximum 100 notifications in localStorage. Older notifications are auto-removed.

### Q: Do notifications persist across sessions?
A: Yes, notifications are stored in localStorage and persist until manually cleared.

### Q: What happens to expired invitations?
A: Expired invitations are automatically removed when `expiresAt` timestamp is reached.

### Q: Can I customize notification sounds?
A: Not currently. Future enhancement: Add sound preferences.

### Q: How do I add a new notification type?
A: 
1. Add type to `AppNotification['type']` in `NotificationManager.ts`
2. Update `renderNotificationIcon()` in `NotificationPanel.ts` and `QuickToast.ts`
3. Set priority ('high' or 'normal') in notification handler
4. Update backend to send new message format

## Need Help?

1. Check the comprehensive README: `src/components/notifications/README.md`
2. Check the implementation summary: `docs/NOTIFICATION_SYSTEM_IMPLEMENTATION.md`
3. Review the code with inline comments
4. Ask the team!

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│ NOTIFICATION SYSTEM QUICK REFERENCE                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ PRIORITY LEVELS:                                    │
│   • High: Shows toast popup + panel                 │
│   • Normal: Shows panel only                        │
│                                                     │
│ HIGH-PRIORITY TYPES:                                │
│   • lobby:invitation                                │
│   • friend_request                                  │
│                                                     │
│ NORMAL-PRIORITY TYPES:                              │
│   • chat:message (1-1 DMs only)                     │
│   • game_started                                    │
│   • achievement                                     │
│   • system                                          │
│                                                     │
│ ACTION RESPONSES:                                   │
│   • lobby:invitation:response                       │
│   • friend:request:response                         │
│                                                     │
│ STORAGE:                                            │
│   • localStorage (max 100 notifications)            │
│   • Auto-removes expired invitations                │
│                                                     │
│ UI COMPONENTS:                                      │
│   • Bell icon (header, shows badge)                 │
│   • NotificationPanel (dropdown)                    │
│   • QuickToast (3s auto-dismiss)                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```
