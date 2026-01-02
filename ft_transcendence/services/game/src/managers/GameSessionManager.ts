// Game Session Manager - Server-side game physics and state management
import { GameSession } from '../types/game.types';
import { GamePlayer } from '../types/player.types';
import { Game as PrismaGame } from '@prisma/client';
import { GameType, GameMode, GameStatus, GAME_CONFIG } from '../utils/constants';
import { sessionStore } from './SessionStore';
import { getRedisClient } from '../communication/RedisPublisher';
import { RedisChannels } from '../types/event.types';
import * as gameRepository from '../repositories/gameRepository';
import { notFound } from '../utils/HttpError';
import { PongEngine, PongEvent } from '../engines/PongEngine';
import { determineWinner } from '../utils/scoreUtils';

const { GAME_LOOP } = GAME_CONFIG;

// Store game engines and intervals
const gameEngines = new Map<string, PongEngine>();
const gameLoops = new Map<string, NodeJS.Timeout>();

/**
 * Create a new game session
 */
export async function createGameSession(data: 
  {
  type: GameType;
  mode: GameMode;
  maxPlayers: number;
  maxScore?: number;
}): Promise<{ game: PrismaGame; gameId: string }>
{
  // Create game in database
  const game = await gameRepository.createGame({
    type: data.type,
    mode: data.mode,
    maxPlayers: data.maxPlayers,
    minPlayers: 2,
    maxScore: data.maxScore,
  });

  // Create in-memory session (no game state - clients calculate physics!)
  const session: GameSession = {
    id: game.id,
    game,
    state: {
      type: game.type as GameType,
      timestamp: Date.now(),
      timeElapsed: 0,
      scores: [0, 0],
      // NO pong/racer state - clients handle physics
    },
    players: new Map(),
    isRunning: false,
    tickCount: 0,
    lastTickTime: Date.now(),
    redisChannel: RedisChannels.gameUpdates(game.id),
  };

  // Store session
  sessionStore.store(game.id, session);

  return { game, gameId: game.id };
}



/**
 * Add player from lobby to game session
 */
export async function addLobbyPlayerToGame(gameId: string, userId: string, username: string): Promise<void>
{
  // Get session
  const session = sessionStore.get(gameId);
  if (!session)
  {
    throw notFound('Game session not found');
  }

  // Check if player already in session
  if (session.players.has(userId))
  {
    console.log(`[GameSessionManager] Player ${userId} already in game ${gameId}`);
    return;
  }

  // Add player to database
  const dbPlayer = await gameRepository.addPlayerToGame({
    gameId,
    userId,
  });

  // Add player to session
  const gamePlayer: GamePlayer = {
    id: dbPlayer.id,
    userId: dbPlayer.userId,
    username: username,
    isConnected: true,
    isReady: true,
    score: 0,
    stats: {},
    joinedAt: new Date(),
  };

  session.players.set(userId, gamePlayer);

  console.log(`[GameSessionManager] ✅ Added ${username} to game ${gameId}`);
}
/**
 * Start a game session
 */
export async function startGameSession(gameId: string): Promise<void>
{
  const session = sessionStore.get(gameId);
  if (!session)
  {
    throw notFound('Game session not found');
  }

  // Update game status in database
  await gameRepository.startGame(gameId);
  session.game.status = GameStatus.PLAYING;
  session.isRunning = true;

  // Create game engine if it's a Pong game
  if (session.game.type === GameType.PONG) {
    const playerIds = Array.from(session.players.keys());
    if (playerIds.length >= 2) {
      const maxScore = session.game.maxScore || 5;
      const engine = new PongEngine(playerIds[0], playerIds[1], maxScore);
      gameEngines.set(gameId, engine);
      
      // Start game loop
      startGameLoop(gameId);
    }
  }

  // Broadcast game started event to all players via websocket
  const redis = await getRedisClient();
  if (redis) {
    const playerIds = Array.from(session.players.keys());
    
    await redis.publish('websocket:broadcast', JSON.stringify({
      userIds: playerIds,
      message: {
        type: 'game:started',
        payload: {
          gameId,
          message: 'Game started',
          players: playerIds,
        },
        timestamp: Date.now(),
      },
    }));
  }

  console.log(`✅ Game ${gameId} started with ${session.players.size} players`);
}

/**
 * Start game loop (60 FPS)
 */
function startGameLoop(gameId: string): void {
  const engine = gameEngines.get(gameId);
  if (!engine) {
    console.error(`[GameLoop] No engine for game ${gameId}`);
    return;
  }
  
  const intervalId = setInterval(async () => {
    // Update physics (fixed 60 FPS, no deltaTime needed)
    const events = engine.update();

    // Broadcast game state (non-blocking)
    broadcastGameState(gameId).catch(err => console.error('[GameLoop] Broadcast error:', err));

    // Broadcast events (goals, hits, etc)
    for (const event of events) {
      broadcastGameEvent(gameId, event).catch(err => console.error('[GameLoop] Event broadcast error:', err));
      
      // Check for game end
      if (event.type === 'game-end') {
        await endGameSession(gameId);
        stopGameLoop(gameId);
      }
    }
  }, GAME_LOOP.TICK_INTERVAL);

  gameLoops.set(gameId, intervalId);
  console.log(`[GameLoop] Started for game ${gameId} at ${GAME_LOOP.TICK_RATE} FPS`);
}

/**
 * Stop game loop
 */
function stopGameLoop(gameId: string): void {
  const intervalId = gameLoops.get(gameId);
  if (intervalId) {
    clearInterval(intervalId);
    gameLoops.delete(gameId);
    gameEngines.delete(gameId);
    console.log(`[GameLoop] Stopped for game ${gameId}`);
  }
}

/**
 * Broadcast game state to all players
 */
async function broadcastGameState(gameId: string): Promise<void> {
  const session = sessionStore.get(gameId);
  const engine = gameEngines.get(gameId);
  
  if (!session || !engine) return;

  const state = engine.getState();
  const redis = await getRedisClient();
  
  if (redis) {
    const playerIds = Array.from(session.players.keys());
    
    await redis.publish('websocket:broadcast', JSON.stringify({
      userIds: playerIds,
      message: {
        type: 'game:state',
        payload: {
          gameId,
          state: {
            ball: state.ball,
            paddle1: state.paddle1,
            paddle2: state.paddle2,
            scores: state.scores,
          },
          timestamp: Date.now(),
        },
      },
    }));
  }
}

/**
 * Broadcast game event (goal, hit, etc)
 */
async function broadcastGameEvent(gameId: string, event: PongEvent): Promise<void> {
  const session = sessionStore.get(gameId);
  if (!session) return;

  const redis = await getRedisClient();
  if (redis) {
    const playerIds = Array.from(session.players.keys());
    // If this is a game-end event, try to include a human-readable winner name
    const eventPayload = {
      type: event.type,
      data: { ...event.data },
    } as any;

    if (event.type === 'game-end' && event.data && event.data.winner) {
      const winnerId = event.data.winner as string;
      const winnerPlayer = session.players.get(winnerId);
      if (winnerPlayer && winnerPlayer.username) {
        eventPayload.data.winnerName = winnerPlayer.username;
      }
    }

    await redis.publish('websocket:broadcast', JSON.stringify({
      userIds: playerIds,
      message: {
        type: 'game:event',
        payload: {
          gameId,
          event: eventPayload,
        },
        timestamp: Date.now(),
      },
    }));
  }
}

/**
 * Handle player input
 */
export function handlePlayerInput(gameId: string, playerId: string, direction: 'up' | 'down' | 'none'): void {
  const engine = gameEngines.get(gameId);
  if (!engine) {
    console.warn(`[GameSessionManager] No engine for game ${gameId}`);
    return;
  }

  engine.handleInput(playerId, { direction });
}

/**
 * Leave a game session
 */
export async function leaveGameSession(gameId: string, userId: string): Promise<void>
{
  const session = sessionStore.get(gameId);
  if (!session)
  {
    throw notFound('Game session not found');
  }

  // Remove player from session
  session.players.delete(userId);

  // Remove player from database
  await gameRepository.removePlayerFromGame(gameId, userId);

  console.log(`[GameSessionManager] Player ${userId} left game ${gameId}`);
}

/**
 * End a game session
 */
export async function endGameSession(gameId: string): Promise<void>
{
  const session = sessionStore.get(gameId);
  if (!session)
  {
    return;
  }

  // Get final scores from engine BEFORE stopping loop (which deletes engine)
  const engine = gameEngines.get(gameId);
  const finalScores = engine ? engine.getState().scores : session.state.scores;

  // Stop game loop
  stopGameLoop(gameId);

  // Mark as not running
  session.isRunning = false;

  // Update game status in database
  await gameRepository.endGame(gameId);

  // Broadcast game finished event to all players via websocket
  const redis = await getRedisClient();
  if (redis) {
    const playerIds = Array.from(session.players.keys());
    // Try to attach winner id and human-readable name
    let winnerId: string | undefined;
    if (engine && typeof engine.getWinner === 'function') {
      winnerId = engine.getWinner() || undefined;
    }
    if (!winnerId) {
      // fallback to score utility
      try {
        const playersArray = Array.from(session.players.values());
        winnerId = determineWinner(playersArray as any);
      } catch (err) {
        // ignore
      }
    }

    const winnerName = winnerId ? session.players.get(winnerId)?.username : undefined;

    await redis.publish('websocket:broadcast', JSON.stringify({
      userIds: playerIds,
      message: {
        type: 'game:finished',
        payload: {
          gameId,
          message: 'Game finished',
          finalScores,
          winnerId: winnerId,
          winnerName: winnerName,
        },
        timestamp: Date.now(),
      },
    }));
  }

  // Remove session from store
  sessionStore.delete(gameId);

  console.log(`✅ Game ${gameId} ended`);
}

/**
 * Get game session
 */
export function getGameSession(gameId: string): GameSession | undefined
{
  return sessionStore.get(gameId);
}
