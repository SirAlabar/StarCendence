# WebSocket Service

A real-time WebSocket server implementation for the Transcendence project using Fastify, WebSocket, and Redis pub/sub for cross-server broadcasting.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API](#api)
- [Events](#events)
- [Rooms](#rooms)
- [Broadcasting](#broadcasting)
- [Authentication](#authentication)
- [Security](#security)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The WebSocket service provides real-time bidirectional communication between the server and clients. It handles:

- **Connection Management**: Authentication, connection pooling, and lifecycle management
- **Event System**: Structured event handling for different game and application events
- **Room Management**: Isolated communication channels for lobbies, games, and chat
- **Redis Pub/Sub**: Cross-server broadcasting for multi-instance deployments
- **Heartbeat System**: Connection health monitoring and automatic cleanup
- **Security**: Token-based authentication, rate limiting, and validation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Service                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Fastify    │  │  WebSocket   │  │    Redis     │     │
│  │   Server     │  │   Handler    │  │   Pub/Sub    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼──────┐     │
│  │         Connection Manager                         │     │
│  │  - Authentication                                  │     │
│  │  - Connection Pool                                 │     │
│  │  - Disconnect Handling                             │     │
│  └──────┬─────────────────────────────────────────────┘     │
│         │                                                    │
│  ┌──────▼─────────────────────────────────────────────┐     │
│  │              Event Manager                          │     │
│  │  - Event Routing                                    │     │
│  │  - Event Validation                                 │     │
│  │  - Event Handlers                                   │     │
│  └──────┬─────────────────────────────────────────────┘     │
│         │                                                    │
│  ┌──────▼─────────────────────────────────────────────┐     │
│  │              Room Manager                           │     │
│  │  - Game Rooms                                       │     │
│  │  - Chat Rooms                                       │     │
│  │  - Tournament Rooms                                 │     │
│  │  - Private Rooms                                    │     │
│  └──────┬─────────────────────────────────────────────┘     │
│         │                                                    │
│  ┌──────▼─────────────────────────────────────────────┐     │
│  │         Broadcast Manager                           │     │
│  │  - Redis Pub/Sub                                    │     │
│  │  - Local Broadcasting                               │     │
│  │  - Cross-Server Broadcasting                        │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Features

- ✅ **JWT Authentication**: Token-based authentication for secure connections
- ✅ **Connection Pooling**: Efficient connection management and tracking
- ✅ **Heartbeat System**: Automatic connection health monitoring
- ✅ **Redis Pub/Sub**: Cross-server message broadcasting
- ✅ **Room System**: Isolated communication channels
- ✅ **Event System**: Structured event handling and routing
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Validation**: Message validation and sanitization
- ✅ **Compression**: Message compression utilities

### Event Types Supported

- **Lobby Events**: Create, join, leave, update
- **Player Events**: Join, leave, ready status, customization
- **Chat Events**: Messages, history
- **Game Events**: Start, update, end
- **Tournament Events**: Tournament-specific events
- **User Events**: Status updates, friend events
- **System Events**: Heartbeat, errors, notifications

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Redis (for pub/sub functionality)

### Setup

1. **Install Dependencies**

```bash
npm install
```

2. **Environment Variables**

Create a `.env` file in the service root:

```env
# Server Configuration
PORT=3005
NODE_ENV=development

# WebSocket Configuration
WS_PATH=/ws
HEALTH_PATH=/health

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=23111
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Logging
LOG_LEVEL=info
```

3. **Build**

```bash
npm run build
```

4. **Start**

```bash
# Development
npm run dev

# Production
npm start
```

## Configuration

### Server Configuration

The server configuration is loaded from `src/config/wsConfig.ts`:

```typescript
interface WSConfig {
  port: number;           // Server port (default: 3005)
  path: string;           // WebSocket path (default: /ws)
  healthPath: string;     // Health check path (default: /health)
  jwtSecret: string;      // JWT secret for token verification
  nodeEnv: string;        // Environment (development/production)
}
```

### Redis Configuration

Redis configuration is in `src/config/redisConfig.ts`:

```typescript
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}
```

### Security Configuration

Security settings in `src/config/securityConfig.ts`:

- Rate limiting thresholds
- Message size limits
- Connection timeouts
- Validation rules

## Usage

### Basic Connection

Clients connect to the WebSocket server with authentication:

```javascript
const token = 'your-jwt-token';
const ws = new WebSocket(`ws://localhost:3005/ws?token=${token}`);
```

### Connection Flow

1. **Client connects** with token in query parameter
2. **Server verifies** JWT token and extracts user info
3. **Connection added** to connection pool
4. **Acknowledgment sent** to client with connection ID
5. **Event handlers** set up for the connection

### Message Format

All messages follow this structure:

```typescript
interface WebSocketMessage {
  type: string;      // Event type (e.g., "lobby:create")
  payload: any;      // Event data
  timestamp?: number; // Optional timestamp
}
```

### Sending Messages

**Client to Server:**

```json
{
  "type": "lobby:create",
  "payload": {
    "gameType": "pong",
    "maxPlayers": 4
  },
  "timestamp": 1234567890
}
```

**Server to Client:**

```json
{
  "type": "lobby:update",
  "payload": {
    "lobbyId": "lobby-123",
    "gameType": "pong",
    "players": [...],
    "status": "waiting"
  },
  "timestamp": 1234567890
}
```

## API

### Connection Endpoints

- **WebSocket**: `ws://host:port/ws?token=JWT_TOKEN`
- **Health Check**: `GET /health`

### Connection Methods

#### `ConnectionManager.handleConnection(socket, req)`

Handles new WebSocket connections:

```typescript
static async handleConnection(
  socket: WebSocket,
  req: FastifyRequest
): Promise<ConnectionInfo | null>
```

**Process:**
1. Extract token from query parameters
2. Verify JWT token
3. Create connection info
4. Add to connection pool
5. Set up event handlers
6. Send acknowledgment

### Event Handling

#### `EventManager.handleEvent(connectionId, message)`

Routes incoming messages to appropriate handlers:

```typescript
static async handleEvent(
  connectionId: string,
  message: WebSocketMessage
): Promise<void>
```

### Room Management

#### `RoomManager.joinRoom(connectionId, roomId, roomType)`

Adds a connection to a room:

```typescript
static async joinRoom(
  connectionId: string,
  roomId: string,
  roomType: RoomType
): Promise<void>
```

#### `RoomManager.leaveRoom(connectionId, roomId)`

Removes a connection from a room:

```typescript
static async leaveRoom(
  connectionId: string,
  roomId: string
): Promise<void>
```

#### `RoomManager.broadcastToRoom(roomId, message, excludeConnectionId?)`

Broadcasts a message to all connections in a room:

```typescript
static async broadcastToRoom(
  roomId: string,
  message: WebSocketMessage,
  excludeConnectionId?: string
): Promise<void>
```

## Events

### Event System Structure

```
src/events/
├── EventManager.ts        # Main event router
├── ChatEvents.ts          # Chat-related events
├── GameEvents.ts          # Game-related events
├── NotificationEvents.ts  # Notification events
├── SystemEvents.ts        # System events (heartbeat, etc.)
├── TournamentEvents.ts    # Tournament events
└── UserEvents.ts          # User status events
```

### Event Types

#### Lobby Events

- `lobby:create` - Create a new lobby
- `lobby:join` - Join a lobby
- `lobby:leave` - Leave a lobby
- `lobby:update` - Lobby state updated
- `lobby:start` - Game started

#### Player Events

- `lobby:player:join` - Player joined lobby
- `lobby:player:leave` - Player left lobby
- `lobby:ready` - Player ready status changed
- `lobby:customization` - Player customization updated

#### Chat Events

- `lobby:chat` - Chat message sent
- `lobby:chat:history` - Request chat history

#### Invitation Events

- `lobby:invite` - Send invitation
- `lobby:invitation` - Receive invitation
- `lobby:accept` - Accept invitation
- `lobby:decline` - Decline invitation

#### User Events

- `user:status` - User status update
- `friend:online` - Friend came online
- `friend:offline` - Friend went offline

#### System Events

- `connection.ack` - Connection acknowledged
- `connection.error` - Connection error
- `system.heartbeat` - Heartbeat ping
- `system.heartbeat.ack` - Heartbeat pong
- `system.error` - System error message

### Adding Custom Events

1. **Define Event Type** in `src/types/event.types.ts`
2. **Create Handler** in appropriate event file (e.g., `GameEvents.ts`)
3. **Register Handler** in `EventManager.ts`
4. **Add Validation** if needed in `src/middleware/validationMiddleware.ts`

Example:

```typescript
// In GameEvents.ts
export async function handleGameUpdate(
  connectionId: string,
  payload: any
): Promise<void> {
  const { gameId, update } = payload;
  
  // Validate
  if (!gameId || !update) {
    throw new Error('Invalid game update payload');
  }
  
  // Broadcast to game room
  await RoomManager.broadcastToRoom(
    `game:${gameId}`,
    {
      type: 'game:update',
      payload: update,
      timestamp: Date.now()
    }
  );
}

// In EventManager.ts
eventHandlers.set('game:update', handleGameUpdate);
```

## Rooms

### Room Types

- **GameRoom**: For active game sessions
- **ChatRoom**: For chat channels
- **TournamentRoom**: For tournament matches
- **PrivateRoom**: For private conversations
- **SpectatorRoom**: For spectator viewing

### Room Naming Convention

- Game rooms: `game:{gameId}`
- Lobby rooms: `lobby:{lobbyId}`
- Chat rooms: `chat:{channelId}`
- Tournament rooms: `tournament:{tournamentId}`
- Private rooms: `private:{userId1}:{userId2}` (sorted)

### Room Management

```typescript
// Join a room
await RoomManager.joinRoom(connectionId, 'lobby-123', RoomType.LOBBY);

// Leave a room
await RoomManager.leaveRoom(connectionId, 'lobby-123');

// Broadcast to room
await RoomManager.broadcastToRoom('lobby-123', message);

// Get room connections
const connections = RoomManager.getRoomConnections('lobby-123');
```

## Broadcasting

### Local Broadcasting

Messages are broadcast locally to connections in the same server instance:

```typescript
await RoomManager.broadcastToRoom(roomId, message);
```

### Cross-Server Broadcasting

For multi-instance deployments, Redis pub/sub is used:

```typescript
// Publish to Redis channel
await redisBroadcast.publish(channel, message);

// Subscribe to Redis channel
await redisBroadcast.subscribe(channel, (message) => {
  // Handle received message
});
```

### Broadcast Channels

- `websocket:broadcast` - Global broadcast channel
- `room:{roomId}` - Room-specific channel
- `user:{userId}` - User-specific channel

## Authentication

### JWT Token Verification

The service uses JWT tokens for authentication:

1. **Client sends token** in query parameter: `ws://host:port/ws?token=JWT_TOKEN`
2. **Server extracts token** from request URL
3. **Token verified** using JWT secret
4. **User info extracted** from token payload
5. **Connection authenticated** and added to pool

### Token Structure

```typescript
interface JWTPayload {
  sub: string;        // User ID
  email: string;      // User email
  username: string;   // Username
  type: string;       // Token type
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

### Authentication Flow

```
Client                    Server
  │                         │
  │─── Connect + Token ────>│
  │                         │
  │                    [Verify Token]
  │                         │
  │                    [Extract User]
  │                         │
  │                    [Create Connection]
  │                         │
  │<── Connection ACK ──────│
  │                         │
```

## Security

### Security Features

1. **JWT Authentication**: All connections require valid JWT token
2. **Rate Limiting**: Protection against message flooding
3. **Message Validation**: All messages are validated before processing
4. **Connection Timeout**: Automatic cleanup of idle connections
5. **Input Sanitization**: Protection against injection attacks
6. **Room Security**: Access control for private rooms

### Rate Limiting

Rate limiting is implemented per connection:

- **Message Rate**: Max messages per second per connection
- **Connection Rate**: Max connection attempts per IP
- **Room Join Rate**: Max room joins per minute

### Security Middleware

Located in `src/middleware/`:

- `authMiddleware.ts` - Authentication verification
- `rateLimitMiddleware.ts` - Rate limiting
- `validationMiddleware.ts` - Message validation
- `securityConfig.ts` - Security configuration

## Development

### Project Structure

```
services/websocket/
├── src/
│   ├── app.ts                    # Fastify app setup
│   ├── server.ts                 # Server entry point
│   ├── broadcasting/             # Redis pub/sub
│   ├── config/                   # Configuration files
│   ├── connections/              # Connection management
│   ├── events/                   # Event handlers
│   ├── middleware/               # Middleware functions
│   ├── rooms/                    # Room management
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
├── package.json
├── tsconfig.json
├── jest.config.js
└── Dockerfile
```

### Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Run tests
npm test

# Run tests with watch
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Adding New Features

1. **Create types** in `src/types/`
2. **Implement handlers** in appropriate directory
3. **Register in manager** (EventManager, RoomManager, etc.)
4. **Add tests** in `src/__tests__/`
5. **Update documentation**

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- connection.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

Tests are located in `src/__tests__/`:

- `connection.test.ts` - Connection management tests
- Additional tests can be added as needed

### Writing Tests

```typescript
import { ConnectionManager } from '../connections/ConnectionManager';

describe('ConnectionManager', () => {
  it('should handle valid connection', async () => {
    // Test implementation
  });
  
  it('should reject invalid token', async () => {
    // Test implementation
  });
});
```

## Deployment

### Docker

The service includes a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3005
CMD ["npm", "start"]
```

### Environment Variables

Set these environment variables in production:

```bash
PORT=3005
NODE_ENV=production
JWT_SECRET=<secret-from-secrets>
REDIS_HOST=redis
REDIS_PORT=23111
REDIS_PASSWORD=<password>
LOG_LEVEL=info
```

### Health Check

The service exposes a health check endpoint:

```bash
curl http://localhost:3005/health
# Response: {"status":"ok"}
```

### Monitoring

The service logs:
- Connection establishment
- Connection closure
- Connected users summary (every 2 minutes)
- Errors and warnings

### Scaling

For multi-instance deployments:

1. **Use Redis Pub/Sub** for cross-server broadcasting
2. **Configure load balancer** with WebSocket support
3. **Sticky sessions** not required (stateless connections)
4. **Monitor connection pool** per instance

## Troubleshooting

### Common Issues

#### Connection Fails

**Problem**: Client cannot connect to WebSocket server

**Solutions**:
1. Check if server is running: `curl http://localhost:3005/health`
2. Verify JWT token is valid
3. Check firewall/network settings
4. Verify WebSocket path matches configuration

#### Authentication Errors

**Problem**: Connection rejected with authentication error

**Solutions**:
1. Verify JWT token is included in query: `?token=JWT_TOKEN`
2. Check JWT_SECRET matches auth service
3. Ensure token is not expired
4. Verify token payload structure

#### Messages Not Received

**Problem**: Client not receiving messages

**Solutions**:
1. Check if client is in correct room
2. Verify message type matches expected format
3. Check server logs for errors
4. Verify Redis pub/sub if using multi-instance

#### Redis Connection Issues

**Problem**: Redis connection errors

**Solutions**:
1. Verify Redis is running
2. Check REDIS_HOST and REDIS_PORT
3. Verify REDIS_PASSWORD if required
4. Check network connectivity to Redis

#### Memory Leaks

**Problem**: Server memory usage increases over time

**Solutions**:
1. Check connection pool cleanup
2. Verify disconnect handlers are firing
3. Check for event listener leaks
4. Monitor room cleanup

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Logs

The service logs important events:

- `[PRODUCTION] WebSocket connection established` - New connection
- `[PRODUCTION] WebSocket connection closed` - Connection closed
- `📊 Connected Users: X connection(s)` - User summary
- Error logs for failures

## API Reference

### ConnectionInfo

```typescript
interface ConnectionInfo {
  connectionId: string;
  userId: string;
  username: string;
  socket: WebSocket;
  connectedAt: Date;
  ip?: string;
  userAgent?: string;
}
```

### WebSocketMessage

```typescript
interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}
```

### Room Types

```typescript
enum RoomType {
  GAME = 'game',
  CHAT = 'chat',
  TOURNAMENT = 'tournament',
  PRIVATE = 'private',
  SPECTATOR = 'spectator'
}
```

## Contributing

When contributing to this service:

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Follow existing code style
5. Add proper error handling
6. Use appropriate logging levels

## License

MIT License - See project root LICENSE file

## Support

For issues or questions:
- Check this README
- Review code comments
- Check server logs
- Refer to frontend integration guide: `WEBSOCKET_FRONTEND_INTEGRATION.md`
