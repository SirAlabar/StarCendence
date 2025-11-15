import { PodConfig } from '../game/utils/PodConfig';

/**
 * Online status for users
 */
export enum OnlineStatus 
{
    ONLINE = 'online',
    OFFLINE = 'offline',
    IN_GAME = 'in_game',
    AWAY = 'away'
}

/**
 * Lobby player interface
 */
export interface LobbyPlayer 
{
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    isOnline: boolean;
    isReady: boolean;
    isHost: boolean;
    isAI: boolean;
    aiDifficulty?: 'easy' | 'hard';
    customization?: PodConfig | null;
    joinedAt: Date;
}

/**
 * Lobby settings interface
 */
export interface LobbySettings 
{
    maxScore?: number;
    gameDuration?: number;
    allowAI: boolean;
    allowSpectators: boolean;
    isPrivate: boolean;
}

/**
 * Main lobby interface
 */
export interface Lobby 
{
    id: string;
    gameType: 'pong' | 'podracer';
    hostId: string;
    hostUsername: string;
    players: LobbyPlayer[];
    maxPlayers: number;
    status: 'waiting' | 'starting' | 'in-progress' | 'finished';
    settings: LobbySettings;
    createdAt: Date;
    startedAt?: Date;
}

/**
 * Lobby invitation interface
 */
export interface LobbyInvitation 
{
    id: string;
    lobbyId: string;
    gameType: 'pong' | 'podracer';
    fromUserId: string;
    fromUsername: string;
    fromAvatarUrl: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: Date;
    expiresAt: Date;
}

/**
 * Friend with online status
 */
export interface FriendWithStatus 
{
    userId: string;
    username: string;
    avatarUrl: string;
    status: OnlineStatus;
    lastSeen?: Date;
    currentGame?: string;
}

/**
 * Chat message interface
 */
export interface LobbyChatMessage 
{
    id: string;
    lobbyId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
    isSystem?: boolean;
}