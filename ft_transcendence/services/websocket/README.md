# WebSocket Service

A real-time WebSocket broadcaster for the Transcendence project. Acts as a message router between clients and backend services (Game, Chat) using Redis pub/sub.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Event Flow](#event-flow)
- [Event Handlers](#event-handlers)
- [Message Structure](#message-structure)
- [Redis Channels](#redis-channels)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)

## Overview

The WebSocket service is a **broadcaster and router**:

**What it does:**
- Authenticates WebSocket connections (JWT)
- Receives events from clients
- Forwards events to backend services via Redis
- Receives broadcast requests from services via Redis
- Sends messages to specific clients/users/rooms

**What it does NOT do:**
- Business logic (lobbies, games, chat)
- Data validation (done by backend services)
- State management (handled by services)

The WebSocket service is **stateless** - it only routes messages between clients and services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      WEBSOCKET SERVICE                               │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  ConnectionManager                                          │    │
│  │  - Authenticates JWT tokens                                │    │
│  │  - Maintains connection pool (userId → socket)             │    │
│  │  - Routes incoming messages to MessageHandler              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  MessageHandler                                             │    │
│  │  - Parses JSON messages                                     │    │
│  │  - Routes to EventManager                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  EventManager                                               │    │
│  │  - Routes events to specific handlers                       │    │
│  └────────────┬───────────────────────────────────────────────┘    │
│               │                                                      │
│  ┌────────────▼─────────────────────────────────────────────────┐  │
│  │  Event Handlers (forward to services)                        │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ GameEvents.ts                                         │   │  │
│  │  │ - game:* events → game:events channel                │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ LobbyEvents.ts                                        │   │  │
│  │  │ - lobby:* events → game:events channel               │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ TournamentEvents.ts                                   │   │  │
│  │  │ - tournament:* events → game:events channel          │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ ChatEvents.ts                                         │   │  │
│  │  │ - chat events → chat:events channel                  │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  RedisEvents.ts (reverse direction - FROM services)        │    │
│  │  - Subscribes to websocket:broadcast                       │    │
│  │  - Receives broadcast requests from services               │    │
│  │  - Sends to clients via targetUserId/userIds/connectionIds│    │
│  └────────────────────────────────────────────────────────────┘    │
└───────────────┬──────────────────────────────┬──────────────────────┘
                │                              │
                │ Publishes                    │ Subscribes
                ▼                              ▼
┌───────────────────────────┐   ┌─────────────────────────────────────┐
│  Redis: game:events       │   │  Redis: websocket:broadcast         │
│  Redis: chat:events       │   │  (services send here to reach       │
│                           │   │   specific clients)                 │
└───────────┬───────────────┘   └─────────────────────────────────────┘
            │ Subscribes
            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                                │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐ │
│  │  Game Service            │  │  Chat Service                   │ │
│  │  - Subscribes:           │  │  - Subscribes:                  │ │
│  │    game:events           │  │    chat:events                  │ │
│  │  - Publishes:            │  │  - Publishes:                   │ │
│  │    websocket:broadcast   │  │    websocket:broadcast          │ │
│  │  - Handles:              │  │  - Handles:                     │ │
│  │    lobby logic           │  │    1-1 messaging                │ │
│  │    game logic            │  │    message storage              │ │
│  │    tournaments           │  │    history                      │ │
│  └─────────────────────────┘  └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Event Flow

### Client → Service (Forward)

1. Client sends event (e.g., `lobby:create`)
2. WebSocket receives via socket
3. MessageHandler parses JSON
4. EventManager routes to handler
5. Handler (LobbyEvents.ts) forwards to Redis channel (`game:events`)
6. Game Service subscribes to `game:events` and processes
7. Game Service publishes result to `websocket:broadcast`
8. WebSocket receives from `websocket:broadcast`
9. WebSocket sends to target clients

**Example: Create Lobby**
```
Client → WS: { type: 'lobby:create', payload: { gameType: 'pong' } }
WS → Redis (game:events): { type: 'lobby:create', payload: {...}, userId, username, connectionId }
Game Service processes...
Game Service → Redis (websocket:broadcast): { targetUserId: '123', message: { type: 'lobby:created', payload: {...} } }
WS → Client: { type: 'lobby:created', payload: { lobbyId: '456', ... } }
```

### Service → Client (Broadcast)

1. Service publishes to `websocket:broadcast` with target
2. RedisEvents.ts receives broadcast request
3. Looks up connections by targetUserId/userIds/connectionIds
4. Sends message to matching clients

**Targeting Options:**
- `targetUserId`: Send to specific user (all their connections)
- `userIds`: Send to multiple users
- `connectionIds`: Send to specific connections
- `roomId`: Send to all users in a room (not implemented yet)

## Event Handlers

Event handlers are located in `src/events/`:

### GameEvents.ts
Handles: `game:move`, `game:action`, `game:start`, `game:pause`, `game:resume`, `game:end`

Forwards to: `game:events` Redis channel

Example:

const gameEvents = ['game:move', 'game:action', 'game:start', ...];
for (const eventType of gameEvents)
{
  EventManager.registerHandler(eventType, async (message, connection) => 
  {
    await redisBroadcast.publishToChannel('game:events', {
      type: message.type,
      payload: message.payload,
      userId: connection.userId,
      username: connection.username,
      connectionId: connection.connectionId,
      timestamp: message.timestamp || Date.now(),
    });
  });
}

### LobbyEvents.ts
Handles: `lobby:create`, `lobby:join`, `lobby:leave`, `lobby:kick`, `lobby:ready`, `lobby:start`, `lobby:chat`

Forwards to: `game:events` Redis channel

Purpose: Lobby management events forwarded to game service

### TournamentEvents.ts
Handles: `tournament:create`, `tournament:join`, `tournament:leave`, `tournament:start`

Forwards to: `game:events` Redis channel

Purpose: Tournament events forwarded to game service

### ChatEvents.ts
Handles: `chat` (1-1 messaging)

Forwards to: `chat:events` Redis channel

Purpose: Direct messages forwarded to chat service

### RedisEvents.ts
**Special handler - reverse direction**

Subscribes to: `websocket:broadcast`

Purpose: Receives broadcast requests FROM services, sends to clients

Structure:

{
  targetUserId?: string,    // Send to all connections of this user
  userIds?: string[],       // Send to multiple users
  connectionIds?: string[], // Send to specific connections
  message: {
    type: string,
    payload: any
  }
}

## Message Structure

### Client → WebSocket

{
  type: string,      // Event type (e.g., "lobby:create")
  payload: any,      // Event data
  timestamp?: number // Optional
}

### WebSocket → Redis (to services)

{
  type: string,           // Event type
  payload: any,           // Event data
  userId: string,         // From connection
  username: string,       // From connection
  connectionId: string,   // From connection
  timestamp: number       // Added by handler
}

### Redis → WebSocket (from services)

{
  targetUserId?: string,    // Target specific user
  userIds?: string[],       // Target multiple users
  connectionIds?: string[], // Target specific connections
  message: {
    type: string,
    payload: any
  }
}

### WebSocket → Client

{
  type: string,
  payload: any
}

## Redis Channels

### game:events
**Direction:** WebSocket → Game Service

**Publishers:** GameEvents.ts, LobbyEvents.ts, TournamentEvents.ts

**Subscriber:** Game Service

**Events:**
- `game:*` - Game state events
- `lobby:*` - Lobby management events
- `tournament:*` - Tournament events

### chat:events
**Direction:** WebSocket → Chat Service

**Publisher:** ChatEvents.ts

**Subscriber:** Chat Service

**Events:**
- `chat` - Direct messages

### websocket:broadcast
**Direction:** Services → WebSocket

**Publishers:** Game Service, Chat Service, etc.

**Subscriber:** RedisEvents.ts

**Purpose:** Services send broadcast requests to reach specific clients

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Redis (for pub/sub)

### Setup

```bash
npm install
npm run build
npm start
```

### Environment Variables

```env
PORT=3005
NODE_ENV=development
JWT_SECRET=your-jwt-secret
REDIS_HOST=localhost
REDIS_PORT=23111
REDIS_PASSWORD=your-redis-password
```

## Configuration

WebSocket endpoint: `ws://localhost:3005/ws?token=JWT_TOKEN`

Health check: `GET http://localhost:3005/health`

Connection authentication uses JWT tokens from the auth service.

## Development

### Project Structure

```
services/websocket/src/
├── app.ts                      # Fastify app setup
├── server.ts                   # Entry point
├── connections/
│   ├── ConnectionManager.ts    # Connection lifecycle
│   ├── MessageHandler.ts       # Message parsing/sending
│   └── ConnectionAuth.ts       # JWT verification
├── events/
│   ├── EventManager.ts         # Event routing
│   ├── GameEvents.ts           # game:* → game:events
│   ├── LobbyEvents.ts          # lobby:* → game:events
│   ├── TournamentEvents.ts     # tournament:* → game:events
│   ├── ChatEvents.ts           # chat → chat:events
│   └── RedisEvents.ts          # websocket:broadcast → clients
├── broadcasting/
│   └── RedisBroadcast.ts       # Redis pub/sub wrapper
└── config/
    ├── wsConfig.ts             # WebSocket config
    └── redisConfig.ts          # Redis config
```

### Commands

```bash
npm run dev    # Development with hot reload
npm run build  # Build TypeScript
npm start      # Run production
```

### Adding Events

1. Add event type to appropriate handler file
2. Include in event array
3. Forward to correct Redis channel with connection info

Example:

const events = ['new:event:type'];
for (const eventType of events)
{
  EventManager.registerHandler(eventType, async (message, connection) => 
  {
    await redisBroadcast.publishToChannel('game:events', {
      type: message.type,
      payload: message.payload,
      userId: connection.userId,
      username: connection.username,
      connectionId: connection.connectionId,
      timestamp: message.timestamp || Date.now(),
    });
  });
}

## Key Points

- **Stateless**: No business logic, only routing
- **Connection info required**: Always include userId, username, connectionId when forwarding to services
- **Two directions**: Client → Service (via event handlers), Service → Client (via RedisEvents)
- **Redis channels**: game:events, chat:events (incoming), websocket:broadcast (outgoing)
- **Allman style**: Opening braces on new lines


# Chat Service

## Overview
Handles 1-1 direct messaging between users. Receives chat events from Redis, stores messages in database, and broadcasts to recipients via WebSocket.

## Architecture

```
Frontend → WebSocket Service → Redis (chat:events) → Chat Service → Database
                                                          ↓
                                      Redis (websocket:broadcast) → WebSocket Service → Frontend
```

## Redis Integration

### Subscribe to: `chat:events`

Messages you'll receive from WebSocket service:

{
  type: 'chat:send',
  payload: {
    recipientId: string,      // User ID of recipient
    messageContent: string,   // Message text
    // optional future fields:
    // attachments?: string[]
    // replyToMessageId?: string
  },
  userId: string,             // Sender user ID
  username: string,           // Sender username
  connectionId: string,       // WebSocket connection ID
  timestamp: number          // Unix timestamp
}

### Publish to: `websocket:broadcast`

To send message to recipient:

{
  targetUserId: string,       // Recipient user ID
  message: {
    type: 'chat:message',
    payload: {
      messageId: string,      // Your generated message ID
      senderId: string,       // Sender user ID
      senderUsername: string, // Sender username
      messageContent: string, // Message text
      timestamp: number,      // Unix timestamp
      // optional:
      // isRead: boolean
      // attachments?: string[]
    }
  }
}

## Implementation Steps

1. **Subscribe to Redis channel**
   
   redisClient.subscribe('chat:events', (message) => {
     handleChatEvent(JSON.parse(message));
   });

2. **Handle incoming messages**
   - Parse event
   - Validate sender has permission to message recipient
   - Store in database
   - Generate message ID
   - Broadcast to recipient
   

4. **Broadcast to recipient**
   
   await redisClient.publish('websocket:broadcast', JSON.stringify({
     targetUserId: recipientId,
     message: {
       type: 'chat:message',
       payload: { /* message data */ }
     }
   }));

## Example Flow

1. User A sends message to User B via WebSocket
2. WebSocket service publishes to `chat:events`
3. Chat service receives event
4. Chat service saves to database
5. Chat service publishes to `websocket:broadcast` with `targetUserId: User B`
6. WebSocket service sends to User B's connection
7. User B receives message in real-time

## Future Features
- Message history/pagination
- Read receipts
- Typing indicators
- Message search
- Blocked users
- Message attachments


## Notes
- All WebSocket events use prefix `chat:`
- Store messages even if recipient is offline
- Recipient receives message when they connect
- Consider rate limiting per user
