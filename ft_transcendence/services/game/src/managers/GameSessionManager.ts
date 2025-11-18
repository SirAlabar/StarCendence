// Game Session Manager - Manages game session lifecycle (relay only, no physics)
import { GameSession, Game } from '../types/game.types';
import { GamePlayer } from '../types/player.types';
import { Game as PrismaGame } from '@prisma/client';
import { GameType, GameMode, GameStatus, PlayerRole, GAME_CONFIG } from '../utils/constants';
import { sessionStore } from './SessionStore';
import { subscribeToPlayerInput, publishGameEvent } from '../communication/RedisPublisher';
import { RedisChannels, GameEventType } from '../types/event.types';
import * as gameRepository from '../repositories/gameRepository';
import { notFound, badRequest } from '../utils/HttpError';
import { getInternalApiKey } from '../utils/secretsUtils';

/**
 * Create a new game session
 */
export async function createGameSession(data: {
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
 * Join a game session
 */
export async function joinGameSession(gameId: string, userId: string): Promise<{ success: boolean; playerRole: PlayerRole; game: Game }>
{
  // Get game from database
  const game = await gameRepository.getGameById(gameId);
  if (!game)
  {
    throw notFound('Game not found');
  }

  // Check if game is full
  if (game.players.length >= game.maxPlayers)
  {
    throw badRequest('Game is full');
  }

  // Check if game already started
  if (game.status === GameStatus.PLAYING || game.status === GameStatus.FINISHED)
  {
    throw badRequest('Game already started or finished');
  }

  // Check if player already in game
  const existingPlayer = game.players.find(p => p.userId === userId);
  if (existingPlayer)
  {
    throw badRequest('Player already in game');
  }

  // Assign player role based on current player count
  const playerRole = getNextPlayerRole(game.players.length);

  // Add player to database
  const dbPlayer = await gameRepository.addPlayerToGame({
    gameId,
    userId,
    playerRole,
  });

  // Get session
  let session = sessionStore.get(gameId);
  if (!session)
  {
    throw notFound('Game session not found');
  }

  // Fetch user data from user service
  const userData = await fetchUserData(userId);
  if (!userData)
  {
    throw badRequest('User not found');
  }

  // Add player to session
  const gamePlayer: GamePlayer = {
    id: dbPlayer.id,
    userId: dbPlayer.userId,
    username: userData.username,
    role: dbPlayer.playerRole as PlayerRole,
    isConnected: true,
    isReady: true,
    score: 0,
    stats: {},
    joinedAt: new Date(),
  };

  session.players.set(userId, gamePlayer);

  // Check if we have enough players to start
  if (session.players.size >= game.minPlayers)
  {
    await startGameSession(gameId);
  }

  return {
    success: true,
    playerRole,
    game: session.game,
  };
}

/**
 * Start a game session (when enough players joined)
 * Backend doesn't run physics - just marks game as started
 */
async function startGameSession(gameId: string): Promise<void>
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

  // Subscribe to player input (paddle positions and score events)
  await subscribeToPlayerInput(gameId, (playerId, input) => {
    handlePlayerInput(gameId, playerId, input);
  });

  // Publish game started event
  await publishGameEvent({
    gameId,
    type: GameEventType.GAME_STARTED,
    timestamp: Date.now(),
    data: {
      message: 'Game started',
      players: Array.from(session.players.keys()),
    },
  });

  console.log(`✅ Game ${gameId} started with ${session.players.size} players`);
}

/**
 * Handle player input (paddle positions and score events)
 * Backend just relays to other players and validates scores
 */
function handlePlayerInput(gameId: string, playerId: string, input: any): void
{
  const session = sessionStore.get(gameId);
  if (!session || !session.isRunning)
  {
    return;
  }

  // Check if this is a paddle position update
  if (input.type === 'paddle_position')
  {
    // Simply relay paddle position to other players (no validation needed)
    publishGameEvent({
      gameId,
      type: GameEventType.PLAYER_JOINED, // Using generic event, or create PADDLE_UPDATE
      timestamp: Date.now(),
      data: {
        playerId,
        paddleY: input.paddleY,
      },
    });
  }
  
  // Check if this is a score event
  else if (input.type === 'score')
  {
    handleScoreEvent(session, playerId, input);
  }
}

/**
 * Handle score event from client
 * Validates the score and broadcasts if valid
 */
async function handleScoreEvent(session: GameSession, playerId: string, scoreData: any): Promise<void>
{
  const player = session.players.get(playerId);
  if (!player)
  {
    return;
  }

  const { scoringPlayerId, newScore } = scoreData;

  // Basic anti-cheat: check if score increased by exactly 1
  const scoringPlayer = session.players.get(scoringPlayerId);
  if (!scoringPlayer)
  {
    return;
  }

  const expectedScore = scoringPlayer.score + 1;
  if (newScore !== expectedScore)
  {
    console.warn(`⚠️ Invalid score from ${playerId}: expected ${expectedScore}, got ${newScore}`);
    return; // Reject invalid score
  }

  // Update score
  scoringPlayer.score = newScore;
  
  // Update in database
  await gameRepository.updatePlayerScore(session.id, scoringPlayerId, newScore);

  // Update session scores array
  const playerIndex = Array.from(session.players.keys()).indexOf(scoringPlayerId);
  if (playerIndex !== -1)
  {
    session.state.scores[playerIndex] = newScore;
  }

  // Broadcast valid score event
  await publishGameEvent({
    gameId: session.id,
    type: GameEventType.PONG_SCORED,
    timestamp: Date.now(),
    data: {
      scored: {
        playerId: scoringPlayerId,
        newScore,
        totalScore: session.state.scores,
      },
    },
  });

  // Check if game should end
  const maxScore = session.game.maxScore || 5;
  if (newScore >= maxScore)
  {
    await endGameSession(session.id);
  }
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

  // If not enough players left, cancel game
  if (session.players.size < session.game.minPlayers)
  {
    await cancelGameSession(gameId);
  }
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

  // Mark as not running
  session.isRunning = false;

  // Update game status in database
  await gameRepository.endGame(gameId);

  // Publish game finished event
  await publishGameEvent({
    gameId,
    type: GameEventType.GAME_FINISHED,
    timestamp: Date.now(),
    data: {
      message: 'Game finished',
      finalScores: session.state.scores,
    },
  });

  // TODO: Save match result to database

  // Remove session from store
  sessionStore.delete(gameId);

  console.log(`✅ Game ${gameId} ended`);
}

/**
 * Cancel a game session
 */
async function cancelGameSession(gameId: string): Promise<void>
{
  const session = sessionStore.get(gameId);
  if (!session)
  {
    return;
  }

  // Mark as not running
  session.isRunning = false;

  // Update game status in database
  await gameRepository.updateGameStatus(gameId, GameStatus.CANCELLED);

  // Publish cancelled event
  await publishGameEvent({
    gameId,
    type: GameEventType.GAME_CANCELLED,
    timestamp: Date.now(),
    data: {
      message: 'Game cancelled - not enough players',
    },
  });

  // Remove session from store
  sessionStore.delete(gameId);

  console.log(`✅ Game ${gameId} cancelled`);
}

/**
 * Get game session
 */
export function getGameSession(gameId: string): GameSession | undefined
{
  return sessionStore.get(gameId);
}

/**
 * Get next player role based on current player count
 */
function getNextPlayerRole(currentCount: number): PlayerRole
{
  switch (currentCount)
  {
    case 0:
      return PlayerRole.PLAYER1;
    case 1:
      return PlayerRole.PLAYER2;
    case 2:
      return PlayerRole.PLAYER3;
    case 3:
      return PlayerRole.PLAYER4;
    default:
      return PlayerRole.SPECTATOR;
  }
}

/**
 * Fetch user data from user service
 */
async function fetchUserData(userId: string): Promise<{ username: string; avatarUrl?: string } | null>
{
  try
  {
    const response = await fetch(`${GAME_CONFIG.SERVICES.USER}/profile`, {
      headers: {
        'Authorization': `Bearer ${userId}`, // In reality, you'd pass proper JWT
        'x-api-key': getInternalApiKey(),
      },
    });

    if (!response.ok)
    {
      console.error(`Failed to fetch user data: ${response.status}`);
      return null;
    }

    const userData = await response.json() as { username: string; avatarUrl?: string };
    return {
      username: userData.username,
      avatarUrl: userData.avatarUrl,
    };
  }
  catch (error)
  {
    console.error('Error fetching user data:', error);
    return null;
  }
}