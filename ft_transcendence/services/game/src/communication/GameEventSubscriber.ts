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

  async initialize(): Promise<void> {
    await this.subscriber.subscribe('game:events', async (message) => {
      await this.handleGameEvent(message);
    });
  }

  private async handleGameEvent(rawMessage: string): Promise<void> {
    try {
      const event = JSON.parse(rawMessage) as GameEventMessage;

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
          break;
      }
    } catch (error) {
      console.error('[GameEventSubscriber] Error handling game event:', error);
    }
  }

  private async handleLobbyCreate(event: GameEventMessage): Promise<void> {
    const { lobbyId, gameType, maxPlayers } = event.payload;
    const { userId, username } = event;

    try {
      await this.lobbyManager.createLobby(
        lobbyId,
        userId,
        username || 'Player',
        gameType,
        maxPlayers || 2
      );

      const players = await this.lobbyManager.getLobbyPlayers(lobbyId);

      console.log(`[GameEventSubscriber] 🔍 LOBBY CREATE DEBUG:`, {
        creatorUserId: userId,
        creatorUsername: username,
        creatorIsHost: players.find(p => p.userId === userId)?.isHost,
        allPlayers: players.map(p => ({ 
          userId: p.userId, 
          username: p.username, 
          isHost: p.isHost 
        }))
      });

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

      const stats = await this.lobbyManager.getLobbyStats(lobbyId);
      console.log(`[GameEventSubscriber] 🎮 Lobby ${lobbyId} created:`, {
        gameType,
        maxPlayers,
        creator: username,
        players: stats.players.map(p => ({ username: p.username, isHost: p.isHost })),
      });
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to create lobby ${lobbyId}:`, error);
      
      await this.broadcastToUser(userId, {
        type: 'lobby:create:ack',
        payload: {
          success: false,
          reason: 'error',
        },
      });
    }
  }

  private async handleLobbyJoin(event: GameEventMessage): Promise<void> {
    const { lobbyId } = event.payload;
    const { userId, username } = event;

    try {
      const result = await this.lobbyManager.joinLobby(lobbyId, userId, username || 'Player');

      if (!result.success) {
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

      const userIds = await this.lobbyManager.getLobbyUserIds(lobbyId);
      const players = await this.lobbyManager.getLobbyPlayers(lobbyId);
      
      console.log(`[GameEventSubscriber] 🔍 LOBBY JOIN DEBUG:`, {
        joiningUserId: userId,
        joiningUsername: username,
        joinerIsHost: players.find(p => p.userId === userId)?.isHost,
        allPlayers: players.map(p => ({ 
          userId: p.userId, 
          username: p.username, 
          isHost: p.isHost 
        }))
      });
      
      console.log(`[GameEventSubscriber] Sending ACK to ${username} with ${players.length} players:`, 
        players.map(p => ({ userId: p.userId, username: p.username, isHost: p.isHost })));
      
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

      if (result.reason !== 'already_joined') {
        const joinerIsHost = players.find(p => p.userId === userId)?.isHost || false;
        
        const otherUserIds = userIds.filter(id => id !== userId);
        
        if (otherUserIds.length > 0) {
          console.log(`[GameEventSubscriber] 🔍 Broadcasting lobby:player:join to ${otherUserIds.length} other players (excluding ${username})`);
          
          await this.broadcastToUsers(otherUserIds, {
            type: 'lobby:player:join',
            payload: {
              lobbyId,
              userId,
              username,
              isHost: joinerIsHost,
              isReady: false,
            },
          });
        } else {
          console.log(`[GameEventSubscriber] No other players to notify about join`);
        }
      }

      console.log(`[GameEventSubscriber] 🎮 Lobby ${lobbyId} state:`, {
        playerCount: players.length,
        players: players.map(p => ({ username: p.username, isHost: p.isHost, isReady: p.isReady })),
        reconnect: result.reason === 'already_joined',
      });
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to join lobby ${lobbyId}:`, error);
      
      await this.broadcastToUser(userId, {
        type: 'lobby:join:ack',
        payload: {
          success: false,
          reason: 'error',
        },
      });
    }
  }

  private async handleLobbyLeave(event: GameEventMessage): Promise<void> {
    const { lobbyId } = event.payload;
    const { userId, username } = event;

    try {
      const userIds = await this.lobbyManager.getLobbyUserIds(lobbyId);

      await this.lobbyManager.leaveLobby(lobbyId, userId);

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

  private async handleLobbyKick(event: GameEventMessage): Promise<void> {
    const { lobbyId, targetUserId } = event.payload;
    const { userId: kickerUserId, username: kickerUsername } = event;

    try {
      const result = await this.lobbyManager.kickPlayer(lobbyId, kickerUserId, targetUserId);

      if (!result.success) {
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

      const userIds = await this.lobbyManager.getLobbyUserIds(lobbyId);

      await this.broadcastToUser(targetUserId, {
        type: 'lobby:player:kicked',
        payload: {
          lobbyId,
          reason: 'kicked_by_host',
        },
      });

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

  private async handleLobbyReady(event: GameEventMessage): Promise<void> {
    const { lobbyId, isReady } = event.payload;
    const { userId, username } = event;

    try {
      console.log(`[GameEventSubscriber] 🎯 ${username} ready status: ${isReady} in lobby ${lobbyId}`);

      await this.lobbyManager.updatePlayerReady(lobbyId, userId, isReady);

      const userIds = await this.lobbyManager.getLobbyUserIds(lobbyId);

      await this.broadcastToUsers(userIds, {
        type: 'lobby:player:ready',
        payload: {
          lobbyId,
          userId,
          username,
          isReady,
        },
      });

      console.log(`[GameEventSubscriber] ✅ Ready status updated and broadcasted for ${username}`);
    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Failed to update ready status:`, error);
    }
  }

  private async handleLobbyStart(event: GameEventMessage): Promise<void> {
    const { lobbyId } = event.payload;
    const { userId } = event;

    console.log(`[GameEventSubscriber] 🚀 Starting game for lobby ${lobbyId} requested by user ${userId}`);

    try {
      const players = await this.lobbyManager.getLobbyPlayers(lobbyId);
      
      if (players.length === 0) {
        console.log(`[GameEventSubscriber] ❌ Cannot start game: lobby ${lobbyId} has no players`);
        return;
      }

      const lobbyData = await this.lobbyManager.getLobbyData(lobbyId);
      if (!lobbyData) {
        console.log(`[GameEventSubscriber] ❌ Cannot start game: lobby ${lobbyId} not found`);
        return;
      }

      const hostPlayer = players.find(p => p.isHost);
      if (!hostPlayer || hostPlayer.userId !== userId) {
        console.log(`[GameEventSubscriber] ❌ Cannot start game: user ${userId} is not the host`);
        return;
      }

      const nonHostPlayers = players.filter(p => !p.isHost);
      const allReady = nonHostPlayers.every(p => p.isReady);
      if (!allReady) {
        console.log(`[GameEventSubscriber] ❌ Cannot start game: not all players are ready`);
        return;
      }

      if (players.length < 2) {
        console.log(`[GameEventSubscriber] ❌ Cannot start game: need at least 2 players (current: ${players.length})`);
        return;
      }

      console.log(`[GameEventSubscriber] ✅ Starting game for lobby ${lobbyId} with ${players.length} players`);

      const userIds = players.map(p => p.userId);
      await this.broadcastToUsers(userIds, {
        type: 'lobby:game:starting',
        payload: { lobbyId }
      });

    } catch (error) {
      console.error(`[GameEventSubscriber] ❌ Error starting game for lobby ${lobbyId}:`, error);
    }
  }

  private async handleLobbyChat(event: GameEventMessage): Promise<void> {
    const { lobbyId, message } = event.payload;
    const { userId, username } = event;

    try {
      const players = await this.lobbyManager.getLobbyPlayers(lobbyId);
      
      if (players.length === 0) {
        console.log(`[GameEventSubscriber] ⚠️  No players found in lobby ${lobbyId}`);
        return;
      }

      const userIds = players.map(p => p.userId);

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
