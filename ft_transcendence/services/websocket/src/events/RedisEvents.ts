/**
 * Redis Channel Event Handlers
 * 
 * Centralized registration of all Redis pub/sub handlers.
 * This file manages all Redis channel subscriptions and their handlers.
 */

import { redisBroadcast } from '../broadcasting/RedisBroadcast';
import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { connectionPool } from '../connections/ConnectionPool';

// ============================================================================
// GAME EVENT FORWARDER
// Forwards game-related events from WebSocket clients to Game Service
// ============================================================================

interface GameEventMessage {
  type: string;
  payload: any;
  userId: string;
  username?: string;
  connectionId: string;
  timestamp: number;
}

/**
 * Check if event should be forwarded to Game Service
 */
function shouldForwardToGameService(eventType: string): boolean {
  const gameEventPrefixes = ['lobby:', 'game:', 'tournament:'];
  return gameEventPrefixes.some(prefix => eventType.startsWith(prefix));
}

/**
 * Forward game events to Game Service via Redis
 */
async function forwardGameEvent(message: WebSocketMessage, connection: ConnectionInfo): Promise<void> {
  if (!shouldForwardToGameService(message.type)) {
    return;
  }

  const gameEvent: GameEventMessage = {
    type: message.type,
    payload: message.payload,
    userId: connection.userId,
    username: connection.username,
    connectionId: connection.connectionId,
    timestamp: message.timestamp || Date.now(),
  };

  // Publish to Redis channel that Game Service subscribes to
  await redisBroadcast.publishToChannel('game:events', gameEvent);

  console.log(`[GameEventForwarder] Forwarded ${message.type} from ${connection.username} to Game Service`);
}

/**
 * Register game event forwarders in EventManager
 */
function registerGameEventForwarder(): void {
  // Common lobby events
  const lobbyEvents = ['lobby:create', 'lobby:join', 'lobby:leave', 'lobby:kick', 'lobby:ready', 'lobby:start', 'lobby:chat'];
  
  // Common game events
  const gameEvents = ['game:move', 'game:action', 'game:start', 'game:pause', 'game:resume', 'game:end'];
  
  // Tournament events
  const tournamentEvents = ['tournament:create', 'tournament:join', 'tournament:leave', 'tournament:start'];
  
  const allEvents = [...lobbyEvents, ...gameEvents, ...tournamentEvents];
  
  for (const eventType of allEvents) {
    EventManager.registerHandler(eventType, forwardGameEvent);
  }

  console.log(`[GameEventForwarder] Registered forwarder for ${allEvents.length} game event types`);
}

// ============================================================================
// BROADCAST HANDLER
// Receives broadcast requests from services and sends to WebSocket clients
// ============================================================================

interface WebSocketBroadcastMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

interface BroadcastRequest {
  // For broadcasting to multiple users
  userIds?: string[];
  
  // For 1-1 messaging
  targetUserId?: string;
  
  // For broadcasting to specific connections
  connectionIds?: string[];
  
  // The message to send
  message: WebSocketBroadcastMessage;
}

/**
 * Handle incoming broadcast requests from Redis
 */
async function handleBroadcastRequest(data: any): Promise<void> {
  try {
    const request = data as BroadcastRequest;
    
    // Debug: Log raw data
    console.log('[BroadcastHandler] Raw broadcast request:', JSON.stringify(request));
    
    if (!request.message || !request.message.type) {
      console.warn('[BroadcastHandler] Invalid broadcast request: missing message or type', {
        hasMessage: !!request.message,
        messageType: request.message?.type,
        requestKeys: Object.keys(request),
      });
      return;
    }

    // Handle broadcast to multiple userIds
    if (request.userIds && request.userIds.length > 0) {
      let sentCount = 0;
      
      for (const userId of request.userIds) {
        const connections = connectionPool.getConnectionsByUserId(userId);
        for (const connection of connections) {
          try {
            if (connection.socket.readyState === 1) { // WebSocket.OPEN
              connection.socket.send(JSON.stringify(request.message));
              sentCount++;
            }
          } catch (error) {
            console.error(`[BroadcastHandler] Error sending to connection ${connection.connectionId}:`, error);
          }
        }
      }
      
      console.log(`[BroadcastHandler] Broadcasted ${request.message.type} to ${sentCount} connection(s) for ${request.userIds.length} user(s)`);
    }
    
    // Handle 1-1 message to single user
    else if (request.targetUserId) {
      connectionPool.broadcastToUser(request.targetUserId, request.message);
      console.log(`[BroadcastHandler] Sent ${request.message.type} to user ${request.targetUserId}`);
    }
    
    // Handle broadcast to specific connectionIds
    else if (request.connectionIds && request.connectionIds.length > 0) {
      let sentCount = 0;
      
      for (const connectionId of request.connectionIds) {
        const connection = connectionPool.get(connectionId);
        if (connection) {
          try {
            if (connection.socket.readyState === 1) { // WebSocket.OPEN
              connection.socket.send(JSON.stringify(request.message));
              sentCount++;
            }
          } catch (error) {
            console.error(`[BroadcastHandler] Error sending to connection ${connectionId}:`, error);
          }
        }
      }
      
      console.log(`[BroadcastHandler] Broadcasted ${request.message.type} to ${sentCount}/${request.connectionIds.length} connection(s)`);
    }
    
    else {
      console.warn('[BroadcastHandler] Broadcast request has no valid target (userIds, targetUserId, or connectionIds)');
    }
  } catch (error) {
    console.error('[BroadcastHandler] Error handling broadcast request:', error);
  }
}

/**
 * Subscribe to websocket:broadcast channel
 */
async function initializeBroadcastHandler(): Promise<void> {
  await redisBroadcast.subscribeToChannel('websocket:broadcast');
  await redisBroadcast.registerChannelHandler('websocket:broadcast', '*', handleBroadcastRequest);
  console.log('[BroadcastHandler] Subscribed to websocket:broadcast channel');
}

// ============================================================================
// INITIALIZATION
// Register all Redis handlers
// ============================================================================

/**
 * Initialize all Redis event handlers
 * Call this once during application startup
 */
export async function initializeRedisHandlers(): Promise<void> {
  // Register game event forwarder (WebSocket → Game Service)
  registerGameEventForwarder();
  
  // Register broadcast handler (Services → WebSocket)
  await initializeBroadcastHandler();
  
  console.log('[RedisEvents] ✅ All Redis handlers initialized');
}


