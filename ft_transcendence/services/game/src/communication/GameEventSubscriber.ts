/**
 * Game Event Subscriber
 * 
 * Subscribes to Redis 'game:events' channel to receive events from WebSocket service.
 * Handles lobby management and broadcasts updates back to WebSocket via 'websocket:broadcast'.
 */

import { RedisClientType } from 'redis';
import { LobbyManager } from '../managers/LobbyManager';

export interface GameEventMessage {
  type: string;
  payload: any;
  userId: string;
  username?: string;
  connectionId: string;
  timestamp: number;
}

export interface WebSocketBroadcastRequest {
  userIds?: string[];
  targetUserId?: string;
  message: {
    type: string;
    payload: any;
    timestamp?: number;
  };
}

export class GameEventSubscriber {
  private subscriber: RedisClientType;
  private publisher: RedisClientType;
  private lobbyManager: LobbyManager;

  constructor(subscriber: RedisClientType, publisher: RedisClientType, lobbyManager: LobbyManager) {
    this.subscriber = subscriber;
    this.publisher = publisher;
    this.lobbyManager = lobbyManager;
  }

  /**
   * Initialize the subscriber
   */
  async initialize(): Promise<void> {
    await this.subscriber.subscribe('game:events', async (message) => {
      await this.handleGameEvent(message);
    });

    console.log('[GameEventSubscriber] ✅ Subscribed to game:events channel');
  }

  /**
   * Handle incoming game events
   */
  private async handleGameEvent(rawMessage: string): Promise<void> {
    try {
      const event = JSON.parse(rawMessage) as GameEventMessage;

      console.log(`[GameEventSubscriber] 📩 Received ${event.type} from ${event.username || event.userId}`);

      switch (event.type) {
        case 'lobby:create':
          await this.handleLobbyCreate(event);
          break;

        case 'lobby:join':
          await this.handleLobbyJoin(event);
          break;

        case 'lobby:leave':
          await this.handleLobbyLeave(event);
          break;

        case 'lobby:kick':
          await this.handleLobbyKick(event);
          break;

        case 'lobby:ready':
          await this.handleLobbyReady(event);
          break;

        case 'lobby:start':
          await this.handleLobbyStart(event);
          break;

        case 'lobby:chat':
          await this.handleLobbyChat(event);
          break;

        default:
          console.log(`[GameEventSubscriber] ⚠️  Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('[GameEventSubscriber] ❌ Error handling game event:', error);
    }
  }

  /**
   * Handle lobby:create
   */
  private async handleLobbyCreate(event: GameEventMessage): Promise<void> {
    const { lobbyId, gameType, maxPlayers } = event.payload;
    const { userId, username } = event;

    try {
      // Create lobby
      await this.lobbyManager.createLobby(
        lobbyId,
        userId,
        username || 'Player',
        gameType,
        maxPlayers || 2
      );

      // Get creator's data
      const players = await this.lobbyManager.getLobbyPlayers(lobbyId);

      // Send success ACK to creator with their own player data
      await this.broadcastToUser(userId, {
        type: 'lobby:create:ack',
        payload: {
          success: true,
          lobbyId,
          players: players.map(p => ({
            userId: p.userId,
            username: p.username,
            isHost: p.isHost,
            isReady: p.isReady,
            joinedAt: p.joinedAt,
          })),
        },
      });

      // Get lobby stats for logging
      const stats = await this.lobbyManager.getLobbyStats(lobbyId);
      console.log(`[GameEventSubscriber] 🎮 Lobby ${lobbyId} created:`, {
        gameType,
        maxPlayers,
        creator: username,
        players: stats.players.map(p => p.username),
      });
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to create lobby ${lobbyId}:`, error);
      
      // Send error ACK
      await this.broadcastToUser(userId, {
        type: 'lobby:create:ack',
        payload: {
          success: false,
          reason: 'error',
        },
      });
    }
  }

  /**
   * Handle lobby:join
   */
  private async handleLobbyJoin(event: GameEventMessage): Promise<void> {
    const { lobbyId } = event.payload;
    const { userId, username } = event;

    try {
      // Join lobby
      const result = await this.lobbyManager.joinLobby(lobbyId, userId, username || 'Player');

      if (!result.success) {
        // Send error ACK to joiner
        await this.broadcastToUser(userId, {
          type: 'lobby:join:ack',
          payload: {
            success: false,
            reason: result.reason,
          },
        });

        console.log(`[GameEventSubscriber] ❌ ${username} failed to join ${lobbyId}: ${result.reason}`);
        return;
      }

      // Get all players in lobby
      const players = await this.lobbyManager.getLobbyPlayers(lobbyId);
      const userIds = players.map(p => p.userId);
      
      console.log(`[GameEventSubscriber] Sending ACK to ${username} with ${players.length} players:`, 
        players.map(p => ({ userId: p.userId, username: p.username, isHost: p.isHost })));
      
      // Send success ACK to joiner with all player userIds (frontend will fetch profiles)
      await this.broadcastToUser(userId, {
        type: 'lobby:join:ack',
        payload: {
          success: true,
          lobbyId,
          players: players.map(p => ({
            userId: p.userId,
            username: p.username,
            isHost: p.isHost,
            isReady: p.isReady,
            joinedAt: p.joinedAt,
          })),
        },
      });

      // Only broadcast join event if user wasn't already in lobby
      if (result.reason !== 'already_joined') {
        // Broadcast to ALL lobby members that someone joined
        await this.broadcastToUsers(userIds, {
          type: 'lobby:player:join',
          payload: {
            lobbyId,
            userId,
            username,
            isHost: players.find(p => p.userId === userId)?.isHost || false,
            isReady: false,
          },
        });
      }

      // Log lobby state
      console.log(`[GameEventSubscriber] 🎮 Lobby ${lobbyId} state:`, {
        playerCount: players.length,
        players: players.map(p => ({ username: p.username, isHost: p.isHost, isReady: p.isReady })),
        reconnect: result.reason === 'already_joined',
      });
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to join lobby ${lobbyId}:`, error);
      
      // Send error ACK
      await this.broadcastToUser(userId, {
        type: 'lobby:join:ack',
        payload: {
          success: false,
          reason: 'error',
        },
      });
    }
  }

  /**
   * Handle lobby:leave
   */
  private async handleLobbyLeave(event: GameEventMessage): Promise<void> {
    const { lobbyId } = event.payload;
    const { userId, username } = event;

    try {
      // Get userIds BEFORE removing player
      const userIds = await this.lobbyManager.getLobbyUserIds(lobbyId);

      // Remove player from lobby
      await this.lobbyManager.leaveLobby(lobbyId, userId);

      // Broadcast leave event to remaining players
      await this.broadcastToUsers(userIds, {
        type: 'lobby:player:leave',
        payload: {
          lobbyId,
          userId,
          username,
          playerId: userId,
        },
      });

      console.log(`[GameEventSubscriber] 👋 ${username} left lobby ${lobbyId}`);
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to leave lobby ${lobbyId}:`, error);
    }
  }

  /**
   * Handle lobby:kick (host kicks a player)
   */
  private async handleLobbyKick(event: GameEventMessage): Promise<void> {
    const { lobbyId, targetUserId } = event.payload;
    const { userId: kickerUserId, username: kickerUsername } = event;

    try {
      // Validate kick permission
      const result = await this.lobbyManager.kickPlayer(lobbyId, kickerUserId, targetUserId);

      if (!result.success) {
        // Send error to kicker
        await this.broadcastToUser(kickerUserId, {
          type: 'lobby:kick:ack',
          payload: {
            success: false,
            reason: result.reason,
            lobbyId,
            targetUserId,
          },
        });

        console.log(`[GameEventSubscriber] ❌ Kick failed: ${result.reason}`);
        return;
      }

      // Get remaining userIds after kick
      const userIds = await this.lobbyManager.getLobbyUserIds(lobbyId);

      // Notify the kicked player
      await this.broadcastToUser(targetUserId, {
        type: 'lobby:player:kicked',
        payload: {
          lobbyId,
          reason: 'kicked_by_host',
        },
      });

      // Broadcast to remaining players that someone was kicked
      await this.broadcastToUsers(userIds, {
        type: 'lobby:player:leave',
        payload: {
          lobbyId,
          userId: targetUserId,
          playerId: targetUserId,
          reason: 'kicked',
        },
      });

      console.log(`[GameEventSubscriber] 🚫 ${kickerUsername} kicked player ${targetUserId} from lobby ${lobbyId}`);
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to kick player:`, error);
    }
  }

  /**
   * Handle lobby:ready
   */
  private async handleLobbyReady(_event: GameEventMessage): Promise<void> {
    // TODO: Implement ready state management
    console.log(`[GameEventSubscriber] 🎯 Lobby ready event (not implemented yet)`);
  }

  /**
   * Handle lobby:start
   */
  private async handleLobbyStart(_event: GameEventMessage): Promise<void> {
    // TODO: Implement game start logic
    console.log(`[GameEventSubscriber] 🚀 Lobby start event (not implemented yet)`);
  }

  /**
   * Handle lobby:chat - broadcast chat message to all players in lobby
   */
  private async handleLobbyChat(event: GameEventMessage): Promise<void> {
    const { lobbyId, message } = event.payload;
    const { userId, username } = event;

    try {
      // Get all players in lobby using LobbyManager
      const players = await this.lobbyManager.getLobbyPlayers(lobbyId);
      
      if (players.length === 0) {
        console.log(`[GameEventSubscriber] ⚠️  No players found in lobby ${lobbyId}`);
        return;
      }

      const userIds = players.map(p => p.userId);

      // Broadcast chat message to all players
      await this.broadcastToUsers(userIds, {
        type: 'lobby:chat',
        payload: {
          lobbyId,
          userId,
          username,
          message,
          timestamp: Date.now(),
        },
      });

      console.log(`[GameEventSubscriber] 💬 ${username} sent chat in lobby ${lobbyId}: "${message}"`);
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to handle chat:`, error);
    }
  }

  /**
   * Broadcast to a single user
   */
  private async broadcastToUser(userId: string, message: any): Promise<void> {
    const request: WebSocketBroadcastRequest = {
      targetUserId: userId,
      message: {
        ...message,
        timestamp: message.timestamp || Date.now(),
      },
    };

    await this.publisher.publish('websocket:broadcast', JSON.stringify(request));
  }

  /**
   * Broadcast to multiple users
   */
  private async broadcastToUsers(userIds: string[], message: any): Promise<void> {
    const request: WebSocketBroadcastRequest = {
      userIds,
      message: {
        ...message,
        timestamp: message.timestamp || Date.now(),
      },
    };

    await this.publisher.publish('websocket:broadcast', JSON.stringify(request));
    console.log(`[GameEventSubscriber] 📤 Broadcasted ${message.type} to ${userIds.length} user(s)`);
  }
}
