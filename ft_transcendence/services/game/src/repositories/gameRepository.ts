// Game Repository - Database operations for games
import { PrismaClient, Game, GamePlayer } from '@prisma/client';
import { GameType, GameMode, GameStatus, PlayerRole } from '../utils/constants';
import { notFound } from '../utils/HttpError';

const prisma = new PrismaClient();

/**
 * Create a new game
 */
export async function createGame(data: {
  type: GameType;
  mode: GameMode;
  maxPlayers: number;
  minPlayers: number;
  maxScore?: number;
  lapCount?: number;
  tournamentId?: string;
}): Promise<Game>
{
  const game = await prisma.game.create({
    data: {
      type: data.type,
      mode: data.mode,
      status: GameStatus.WAITING,
      maxPlayers: data.maxPlayers,
      minPlayers: data.minPlayers,
      maxScore: data.maxScore,
      lapCount: data.lapCount,
      tournamentId: data.tournamentId,
    },
  });

  return game;
}

/**
 * Get game by ID with players
 */
export async function getGameById(gameId: string): Promise<(Game & { players: GamePlayer[] }) | null>
{
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: true },
  });

  return game;
}

/**
 * Update game status
 */
export async function updateGameStatus(gameId: string, status: GameStatus): Promise<Game>
{
  const game = await prisma.game.update({
    where: { id: gameId },
    data: { status },
  });

  return game;
}

/**
 * Start game (set startedAt timestamp)
 */
export async function startGame(gameId: string): Promise<Game>
{
  const game = await prisma.game.update({
    where: { id: gameId },
    data: {
      status: GameStatus.PLAYING,
      startedAt: new Date(),
    },
  });

  return game;
}

/**
 * End game (set endedAt timestamp)
 */
export async function endGame(gameId: string): Promise<Game>
{
  const game = await prisma.game.update({
    where: { id: gameId },
    data: {
      status: GameStatus.FINISHED,
      endedAt: new Date(),
    },
  });

  return game;
}

/**
 * Add player to game
 */
export async function addPlayerToGame(data: {
  gameId: string;
  userId: string;
  playerRole: PlayerRole;
}): Promise<GamePlayer>
{
  const player = await prisma.gamePlayer.create({
    data: {
      gameId: data.gameId,
      userId: data.userId,
      playerRole: data.playerRole,
      isReady: false,
      isConnected: true,
      score: 0,
    },
  });

  return player;
}

/**
 * Remove player from game
 */
export async function removePlayerFromGame(gameId: string, userId: string): Promise<void>
{
  await prisma.gamePlayer.deleteMany({
    where: {
      gameId,
      userId,
    },
  });
}

/**
 * Update player score
 */
export async function updatePlayerScore(gameId: string, userId: string, score: number): Promise<GamePlayer>
{
  await prisma.gamePlayer.updateMany({
    where: {
      gameId,
      userId,
    },
    data: { score },
  });

  // Fetch and return the updated player
  const updatedPlayer = await prisma.gamePlayer.findFirst({
    where: {
      gameId,
      userId,
    },
  });

  if (!updatedPlayer)
  {
    throw notFound('Player not found');
  }

  return updatedPlayer;
}

/**
 * Get all players in a game
 */
export async function getGamePlayers(gameId: string): Promise<GamePlayer[]>
{
  const players = await prisma.gamePlayer.findMany({
    where: { gameId },
    orderBy: { joinedAt: 'asc' },
  });

  return players;
}

/**
 * Get active games
 */
export async function getActiveGames(): Promise<(Game & { players: GamePlayer[] })[]>
{
  const games = await prisma.game.findMany({
    where: {
      status: {
        in: [GameStatus.WAITING, GameStatus.READY, GameStatus.PLAYING],
      },
    },
    include: {
      players: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return games;
}

/**
 * Delete game
 */
export async function deleteGame(gameId: string): Promise<void>
{
  await prisma.game.delete({
    where: { id: gameId },
  });
}