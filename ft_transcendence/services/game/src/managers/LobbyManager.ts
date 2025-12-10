import { RedisClientType } from 'redis';
import { randomBytes } from 'crypto';

export interface LobbyPlayer {
  userId: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface LobbyData {
  lobbyId: string;
  gameType: string;
  maxPlayers: number;
  createdBy: string;
  createdAt: number;
  status: 'waiting' | 'ready' | 'starting' | 'in_game';
}

export class LobbyManager {
  private redis: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redis = redisClient;
  }

  /**
   * Generate a random 8-digit lobby ID
   */
  private generateLobbyId(): string {
    // Generate random bytes and convert to 8-digit number
    const randomNum = randomBytes(4).readUInt32BE(0) % 100000000;
    return randomNum.toString().padStart(8, '0');
  }

  /**
   * Generate a unique lobby ID that doesn't exist in Redis
   */
  async generateUniqueLobbyId(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const lobbyId = this.generateLobbyId();
      const exists = await this.redis.exists(`lobby:${lobbyId}:data`);
      
      if (!exists) {
        return lobbyId;
      }
      
      attempts++;
    }

    throw new Error('Failed to generate unique lobby ID after multiple attempts');
  }

  async createLobby(
    lobbyId: string,
    userId: string,
    username: string,
    gameType: string,
    maxPlayers: number
  ): Promise<void> {
    await this.redis.hSet(`lobby:${lobbyId}:data`, {
      lobbyId,
      gameType,
      maxPlayers: maxPlayers.toString(),
      createdBy: userId,
      createdAt: Date.now().toString(),
      status: 'waiting',
    });

    await this.redis.sAdd(`lobby:${lobbyId}:players`, userId);

    await this.redis.hSet(`lobby:${lobbyId}:player:${userId}`, {
      userId,
      username,
      isHost: 'true',
      isReady: 'false',
      joinedAt: Date.now().toString(),
    });

    await this.redis.expire(`lobby:${lobbyId}:data`, 3600);
    await this.redis.expire(`lobby:${lobbyId}:players`, 3600);
    await this.redis.expire(`lobby:${lobbyId}:player:${userId}`, 3600);

    console.log(`[LobbyManager] Created lobby ${lobbyId} by ${username} (${gameType}, max: ${maxPlayers})`);
  }

  async joinLobby(lobbyId: string, userId: string, username: string): Promise<{
    success: boolean;
    reason?: string;
    playerCount?: number;
  }> {
    // Check if lobby exists
    const exists = await this.redis.exists(`lobby:${lobbyId}:data`);
    if (!exists) {
      console.log(`[LobbyManager] Lobby ${lobbyId} not found`);
      return { success: false, reason: 'room_not_found' };
    }

    const isAlreadyMember = await this.redis.sIsMember(`lobby:${lobbyId}:players`, userId);
    if (isAlreadyMember) {
      console.log(`[LobbyManager] User ${username} already in lobby ${lobbyId}`);
      return { success: true, reason: 'already_joined' };
    }

    const lobbyDataRaw = await this.redis.hGetAll(`lobby:${lobbyId}:data`);
    const maxPlayers = parseInt(lobbyDataRaw.maxPlayers || '2');
    const currentPlayers = await this.redis.sCard(`lobby:${lobbyId}:players`);

    if (currentPlayers >= maxPlayers) {
      console.log(`[LobbyManager] Lobby ${lobbyId} is full (${currentPlayers}/${maxPlayers})`);
      return { success: false, reason: 'room_full', playerCount: currentPlayers };
    }

    await this.redis.sAdd(`lobby:${lobbyId}:players`, userId);

    await this.redis.hSet(`lobby:${lobbyId}:player:${userId}`, {
      userId,
      username,
      isHost: 'false',
      isReady: 'false',
      joinedAt: Date.now().toString(),
    });
    await this.redis.expire(`lobby:${lobbyId}:player:${userId}`, 3600);

    console.log(`[LobbyManager] ${username} joined lobby ${lobbyId} (${currentPlayers + 1}/${maxPlayers})`);

    return { success: true, playerCount: currentPlayers + 1 };
  }

  async leaveLobby(lobbyId: string, userId: string): Promise<void> {
    await this.redis.sRem(`lobby:${lobbyId}:players`, userId);
    await this.redis.del(`lobby:${lobbyId}:player:${userId}`);

    const playerCount = await this.redis.sCard(`lobby:${lobbyId}:players`);
    if (playerCount === 0) {
      await this.deleteLobby(lobbyId);
      console.log(`[LobbyManager] Deleted empty lobby ${lobbyId}`);
    } else {
      console.log(`[LobbyManager] User ${userId} left lobby ${lobbyId} (${playerCount} remaining)`);
    }
  }

  async kickPlayer(
    lobbyId: string,
    kickerUserId: string,
    targetUserId: string
  ): Promise<{
    success: boolean;
    reason?: string;
  }> {
    const exists = await this.redis.exists(`lobby:${lobbyId}:data`);
    if (!exists) {
      return { success: false, reason: 'lobby_not_found' };
    }

    const kickerData = await this.redis.hGetAll(`lobby:${lobbyId}:player:${kickerUserId}`);
    if (!kickerData || kickerData.isHost !== 'true') {
      console.log(`[LobbyManager] User ${kickerUserId} is not host, cannot kick`);
      return { success: false, reason: 'not_host' };
    }

    const isMember = await this.redis.sIsMember(`lobby:${lobbyId}:players`, targetUserId);
    if (!isMember) {
      return { success: false, reason: 'player_not_found' };
    }

    if (kickerUserId === targetUserId) {
      return { success: false, reason: 'cannot_kick_self' };
    }

    await this.redis.sRem(`lobby:${lobbyId}:players`, targetUserId);
    await this.redis.del(`lobby:${lobbyId}:player:${targetUserId}`);

    console.log(`[LobbyManager] Host ${kickerUserId} kicked ${targetUserId} from lobby ${lobbyId}`);
    return { success: true };
  }

  async updatePlayerReady(lobbyId: string, userId: string, isReady: boolean): Promise<void> {
    const isMember = await this.redis.sIsMember(`lobby:${lobbyId}:players`, userId);
    if (!isMember) {
      throw new Error('Player not in lobby');
    }

    await this.redis.hSet(`lobby:${lobbyId}:player:${userId}`, 'isReady', isReady.toString());
    
    console.log(`[LobbyManager] Player ${userId} ready status updated to ${isReady} in lobby ${lobbyId}`);
  }

  async getLobbyPlayers(lobbyId: string): Promise<LobbyPlayer[]> {
    const userIds = await this.redis.sMembers(`lobby:${lobbyId}:players`);
    const players: LobbyPlayer[] = [];

    for (const userId of userIds) {
      const playerData = await this.redis.hGetAll(`lobby:${lobbyId}:player:${userId}`);
      if (playerData && playerData.userId) {
        players.push({
          userId: playerData.userId,
          username: playerData.username || 'Unknown',
          isHost: playerData.isHost === 'true',
          isReady: playerData.isReady === 'true',
          joinedAt: parseInt(playerData.joinedAt || '0'),
        });
      }
    }

    return players;
  }

  async getLobbyUserIds(lobbyId: string): Promise<string[]> {
    return await this.redis.sMembers(`lobby:${lobbyId}:players`);
  }

  async getLobbyData(lobbyId: string): Promise<LobbyData | null> {
    const data = await this.redis.hGetAll(`lobby:${lobbyId}:data`);
    if (!data || !data.lobbyId) {
      return null;
    }

    return {
      lobbyId: data.lobbyId,
      gameType: data.gameType,
      maxPlayers: parseInt(data.maxPlayers || '2'),
      createdBy: data.createdBy,
      createdAt: parseInt(data.createdAt || '0'),
      status: data.status as any,
    };
  }

  async deleteLobby(lobbyId: string): Promise<void> {
    const userIds = await this.redis.sMembers(`lobby:${lobbyId}:players`);
    
    const multi = this.redis.multi();
    multi.del(`lobby:${lobbyId}:data`);
    multi.del(`lobby:${lobbyId}:players`);
    
    for (const userId of userIds) {
      multi.del(`lobby:${lobbyId}:player:${userId}`);
    }
    
    await multi.exec();
  }

  async getLobbyStats(lobbyId: string): Promise<{
    exists: boolean;
    playerCount: number;
    players: LobbyPlayer[];
    data: LobbyData | null;
  }> {
    const data = await this.getLobbyData(lobbyId);
    const players = data ? await this.getLobbyPlayers(lobbyId) : [];

    return {
      exists: data !== null,
      playerCount: players.length,
      players,
      data,
    };
  }
}
