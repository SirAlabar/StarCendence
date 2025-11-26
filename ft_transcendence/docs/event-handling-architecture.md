# Event Handling Architecture for Notification System

## Current Architecture Overview

```
Game Service (Producer)
    ↓ Redis Pub/Sub
WebSocket Service (Consumer/Broadcaster)
    ↓ WebSocket
Frontend (Client)
```

## Recommended Event Handling Pattern

### 1. Centralized Event Bus Pattern (Recommended)

This is the **best approach** for your notification system because:
- ✅ Decouples event producers from consumers
- ✅ Allows multiple services to listen to the same events
- ✅ Easy to add notification handlers without modifying game logic
- ✅ Supports event filtering and transformation
- ✅ Enables event replay and auditing

```typescript
// services/game/src/events/EventBus.ts
import { EventEmitter } from 'events';
import { GameEvent, GameEventType } from '../types/event.types';

export class EventBus extends EventEmitter {
    private static instance: EventBus;

    private constructor() {
        super();
        this.setMaxListeners(50); // Increase if needed
    }

    static getInstance(): EventBus {
        if (!this.instance) {
            this.instance = new EventBus();
        }
        return this.instance;
    }

    // Emit game event
    emitGameEvent(event: GameEvent): void {
        this.emit('game:event', event);
        this.emit(`game:${event.type}`, event);
        this.emit(`game:${event.gameId}:${event.type}`, event);
    }

    // Subscribe to all game events
    onGameEvent(handler: (event: GameEvent) => void): () => void {
        this.on('game:event', handler);
        return () => this.off('game:event', handler);
    }

    // Subscribe to specific event type
    onEventType(type: GameEventType, handler: (event: GameEvent) => void): () => void {
        const eventName = `game:${type}`;
        this.on(eventName, handler);
        return () => this.off(eventName, handler);
    }

    // Subscribe to specific game events
    onGameEvents(gameId: string, handler: (event: GameEvent) => void): () => void {
        const eventName = `game:${gameId}`;
        this.on(eventName, handler);
        return () => this.off(eventName, handler);
    }
}

export const eventBus = EventBus.getInstance();
```

### 2. Notification Service Integration

```typescript
// services/game/src/notifications/NotificationService.ts
import { eventBus } from '../events/EventBus';
import { GameEvent, GameEventType } from '../types/event.types';
import { publishGameEvent } from '../communication/RedisPublisher';

export interface Notification {
    userId: string;
    type: 'game' | 'achievement' | 'tournament' | 'friend' | 'system';
    title: string;
    message: string;
    data?: any;
    timestamp: number;
    read: boolean;
}

export class NotificationService {
    private static instance: NotificationService;
    private unsubscribers: Array<() => void> = [];

    private constructor() {
        this.setupEventListeners();
    }

    static getInstance(): NotificationService {
        if (!this.instance) {
            this.instance = new NotificationService();
        }
        return this.instance;
    }

    private setupEventListeners(): void {
        // Listen to game events and create notifications
        const unsub1 = eventBus.onEventType(
            GameEventType.GAME_FINISHED,
            (event) => this.handleGameFinished(event)
        );

        const unsub2 = eventBus.onEventType(
            GameEventType.PONG_SCORED,
            (event) => this.handleScored(event)
        );

        const unsub3 = eventBus.onEventType(
            GameEventType.PLAYER_LEFT,
            (event) => this.handlePlayerLeft(event)
        );

        this.unsubscribers.push(unsub1, unsub2, unsub3);
    }

    private async handleGameFinished(event: GameEvent): Promise<void> {
        // Create notification for game finish
        console.log('[NotificationService] Game finished:', event.gameId);
        
        // Publish to Redis for WebSocket service to broadcast
        await publishGameEvent({
            ...event,
            type: GameEventType.GAME_FINISHED,
        });
    }

    private async handleScored(event: GameEvent): Promise<void> {
        console.log('[NotificationService] Score event:', event);
        // Handle score notifications
    }

    private async handlePlayerLeft(event: GameEvent): Promise<void> {
        console.log('[NotificationService] Player left:', event);
        // Notify other players
    }

    cleanup(): void {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }
}

export const notificationService = NotificationService.getInstance();
```

### 3. Integrate with Game Service App

```typescript
// services/game/src/app.ts
import { notificationService } from './notifications/NotificationService';
import { eventBus } from './events/EventBus';

export async function initializeServices(): Promise<void> {
    console.log('🔄 Connecting to Redis...');
    await initializeRedis();
    
    console.log('🔄 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Initialize notification service
    console.log('🔄 Initializing notification service...');
    notificationService; // Just access it to initialize
    console.log('✅ Notification service ready');
}

export async function cleanupServices(): Promise<void> {
    console.log('🔄 Shutting down gracefully...');
    
    // Cleanup notification service
    notificationService.cleanup();
    
    await closeRedis();
    await prisma.$disconnect();
    console.log('✅ Shutdown complete');
}
```

### 4. Update Game Manager to Use Event Bus

```typescript
// services/game/src/managers/GameManager.ts (example)
import { eventBus } from '../events/EventBus';
import { GameEventType } from '../types/event.types';

export class GameManager {
    private handleScore(playerId: string): void {
        // Update game state...
        
        // Emit event through event bus
        eventBus.emitGameEvent({
            gameId: this.gameId,
            type: GameEventType.PONG_SCORED,
            timestamp: Date.now(),
            data: {
                playerId,
                username: this.getPlayerName(playerId),
                score: this.getPlayerScore(playerId),
            },
        });
    }

    private finishGame(winner: string): void {
        // Finalize game state...
        
        // Emit game finished event
        eventBus.emitGameEvent({
            gameId: this.gameId,
            type: GameEventType.GAME_FINISHED,
            timestamp: Date.now(),
            data: {
                winner,
                finalScores: this.getFinalScores(),
            },
        });
    }
}
```

### 5. WebSocket Service Notification Handler

```typescript
// services/websocket/src/events/NotificationEvents.ts
import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { ConnectionManager } from '../connections/ConnectionManager';

// Register notification handlers
EventManager.registerHandler('notification:markRead', handleMarkRead);
EventManager.registerHandler('notification:markAllRead', handleMarkAllRead);
EventManager.registerHandler('notification:getAll', handleGetAll);

async function handleMarkRead(message: WebSocketMessage, connection: ConnectionInfo): Promise<void> {
    const { notificationId } = message.payload || {};
    
    if (!notificationId) {
        return;
    }

    // Mark notification as read (call notification service API)
    // Then broadcast to user's other connections
    const userConnections = ConnectionManager.getUserConnections(connection.userId);
    userConnections.forEach(conn => {
        conn.socket.send(JSON.stringify({
            type: 'notification:read',
            payload: { notificationId },
        }));
    });
}

async function handleMarkAllRead(message: WebSocketMessage, connection: ConnectionInfo): Promise<void> {
    // Mark all as read for this user
    const userConnections = ConnectionManager.getUserConnections(connection.userId);
    userConnections.forEach(conn => {
        conn.socket.send(JSON.stringify({
            type: 'notification:allRead',
            payload: {},
        }));
    });
}

async function handleGetAll(message: WebSocketMessage, connection: ConnectionInfo): Promise<void> {
    // Fetch all notifications for user (call notification service API)
    // Then send to requesting connection
    connection.socket.send(JSON.stringify({
        type: 'notification:list',
        payload: {
            notifications: [], // Fetch from notification service
        },
    }));
}
```

### 6. Redis Event Forwarding

```typescript
// services/websocket/src/events/RedisEvents.ts (add to existing)
import { redisBroadcast } from '../broadcasting/RedisBroadcast';
import { ConnectionManager } from '../connections/ConnectionManager';

// Listen to notification events from Redis
redisBroadcast.subscribe('notification:*', (channel: string, message: string) => {
    try {
        const data = JSON.parse(message);
        const userId = data.userId;

        if (!userId) {
            return;
        }

        // Broadcast to all user's connections
        const connections = ConnectionManager.getUserConnections(userId);
        connections.forEach(conn => {
            conn.socket.send(JSON.stringify({
                type: 'notification:new',
                payload: data,
            }));
        });
    } catch (error) {
        console.error('[RedisEvents] Error handling notification:', error);
    }
});
```

## Benefits of This Architecture

### 1. **Separation of Concerns**
- Game logic emits events
- Notification service listens and processes
- No tight coupling

### 2. **Scalability**
- Easy to add new event handlers
- Multiple services can listen to same events
- Can add event queues later (RabbitMQ, Kafka)

### 3. **Flexibility**
- Filter events before processing
- Transform event data
- Batch notifications
- Rate limiting

### 4. **Testability**
- Mock EventBus in tests
- Test notification logic independently
- Test game logic without notifications

### 5. **Maintainability**
- Clear event flow
- Easy to debug
- Simple to add new notification types

## Alternative Patterns (Less Recommended)

### ❌ Direct Coupling
```typescript
// DON'T DO THIS
class GameManager {
    private handleScore() {
        // Game logic
        notificationService.sendNotification(...); // Tight coupling
    }
}
```

### ⚠️ Observer Pattern
```typescript
// OK but less flexible
class GameManager {
    private observers: Array<(event) => void> = [];
    
    subscribe(fn) { this.observers.push(fn); }
    notify(event) { this.observers.forEach(fn => fn(event)); }
}
```

### ⚠️ Middleware Pattern
```typescript
// Good for request/response, overkill for events
const middleware = [authMiddleware, validationMiddleware, notificationMiddleware];
```

## Migration Path

1. **Phase 1**: Add EventBus alongside existing Redis publisher
2. **Phase 2**: Create NotificationService that listens to EventBus
3. **Phase 3**: Add notification handlers to WebSocket service
4. **Phase 4**: Connect frontend global handler to receive notifications
5. **Phase 5**: Add notification persistence (optional)

## Event Flow Diagram

```
Game Engine (Pong/Racer)
    ↓ emitGameEvent()
EventBus (Local Event Bus)
    ↓ listeners
    ├─→ NotificationService (creates notifications)
    │       ↓ Redis publish
    │   Redis (notification:userId)
    │       ↓ subscribe
    │   WebSocket Service
    │       ↓ send()
    │   Frontend GlobalWebSocketHandler
    │       ↓ registerNotificationHandler()
    │   UI Toast/Badge
    │
    └─→ RedisPublisher (publishes game state/events)
            ↓ Redis publish
        Redis (game:id:updates)
            ↓ subscribe
        WebSocket Service
            ↓ send()
        Frontend Game Page
```

## Implementation Checklist

- [ ] Create EventBus in game service
- [ ] Create NotificationService
- [ ] Update game managers to emit events through EventBus
- [ ] Update app.ts to initialize NotificationService
- [ ] Add notification handlers to WebSocket service
- [ ] Subscribe to Redis notification channels in WebSocket service
- [ ] Test end-to-end notification flow
- [ ] Add notification persistence (database)
- [ ] Add notification preferences (user settings)
- [ ] Add notification rate limiting

## Best Practices

1. **Use EventBus for all internal events** - Don't call services directly
2. **Keep events immutable** - Once emitted, don't modify
3. **Include timestamps** - For ordering and debugging
4. **Use typed events** - TypeScript interfaces for safety
5. **Log all events** - For debugging and auditing
6. **Handle errors gracefully** - Don't let one bad listener crash others
7. **Clean up listeners** - Always unsubscribe when done
8. **Batch notifications** - Don't spam users
9. **Make notifications actionable** - Include links/actions
10. **Test event flow** - Unit and integration tests
