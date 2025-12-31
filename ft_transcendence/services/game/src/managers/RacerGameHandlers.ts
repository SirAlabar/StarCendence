// Racer Game Handlers - Game Service validation and event broadcasting
import { sessionStore } from '../managers/SessionStore';
import { GameSession } from '../types/game.types';
import { getRedisClient } from '../communication/RedisPublisher';
import { GameStatus } from '../utils/constants';
import * as gameRepository from '../repositories/gameRepository';

/**
 * Player state in racer game
 */
interface RacerPlayer
{
  userId: string;
  username: string;
  podId: string | null;
  podConfig: any;
  isReady: boolean;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: number;
  currentLap: number;
  lastCheckpoint: number;
  checkpointsHit: number[];
  lapTimes: number[];
  racePosition: number;
  isFinished: boolean;
  lastPositionUpdate: number;
}

/**
 * Track configuration
 */
interface TrackCheckpoint
{
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
}

/**
 * Validation constants
 */
const VALIDATION = {
  MAX_SPEED: 200, // Maximum pod speed (will multiply by pod-specific multiplier)
  SPEED_TOLERANCE: 1.15, // 15% tolerance for lag/physics variance
  MAX_POSITION_DELTA: 50, // Maximum distance between position updates (anti-teleport)
  CHECKPOINT_RADIUS: 15, // How close player must be to checkpoint
  MIN_LAP_TIME: 10000, // Minimum lap time (10 seconds) to prevent cheating
  POSITION_UPDATE_RATE: 100, // Minimum ms between position updates (10 FPS)
};

/**
 * Initialize racer handlers for a game
 */
export async function initializeRacerHandlers(gameId: string): Promise<void>
{
  const session = sessionStore.get(gameId);
  if (!session)
  {
    console.error(`❌ Cannot initialize racer handlers - session ${gameId} not found`);
    return;
  }

  // Initialize racer-specific state
  if (!session.state.racer)
  {
    session.state.racer = {
      pods: [],
      checkpoints: getDefaultCheckpoints(),
      currentLap: [],
      positions: [],
    };
  }

  console.log(`✅ Racer handlers initialized for game ${gameId}`);
}

/**
 * Get default track checkpoints (placeholder - should load from track config)
 */
function getDefaultCheckpoints(): TrackCheckpoint[]
{
  // TODO: Load from track configuration based on selected track
  // For now, return a simple circular track with 8 checkpoints
  const checkpoints: TrackCheckpoint[] = [];
  const radius = 100;
  const count = 8;
  
  for (let i = 0; i < count; i++)
  {
    const angle = (i / count) * Math.PI * 2;
    checkpoints.push({
      id: i,
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius,
      radius: VALIDATION.CHECKPOINT_RADIUS,
    });
  }
  
  return checkpoints;
}

/**
 * Helper function to broadcast message to all players in a game
 * Uses the same pattern as GameEventSubscriber
 */
async function broadcastToGame(gameId: string, message: any): Promise<void>
{
  const session = sessionStore.get(gameId);
  if (!session)
  {
    return;
  }

  // Get all userIds in this game
  const userIds = Array.from(session.players.keys());
  
  if (userIds.length === 0)
  {
    return;
  }

  // Get Redis client
  const redis = getRedisClient();
  if (!redis)
  {
    console.error('❌ Redis client not available');
    return;
  }

  // Publish to websocket:broadcast channel (same pattern as GameEventSubscriber)
  const broadcastRequest = {
    userIds,
    message: {
      type: message.type,
      payload: message.payload,
      timestamp: message.timestamp || Date.now(),
    },
  };

  await redis.publish('websocket:broadcast', JSON.stringify(broadcastRequest));
}

/**
 * Handle racer:join event
 */
export async function handleRacerJoin(data: any): Promise<void>
{
  try
  {
    const { gameId, userId, username } = data.payload;

    if (!gameId || !userId)
    {
      console.warn('⚠️ Invalid racer:join data:', data);
      return;
    }

    const session = sessionStore.get(gameId);
    if (!session)
    {
      console.error(`❌ Game session ${gameId} not found`);
      return;
    }

    // Check if player already in session
    if (session.players.has(userId))
    {
      console.log(`ℹ️ Player ${username} already in racer game ${gameId}`);
      return;
    }

    // Check if game is full
    if (session.players.size >= session.game.maxPlayers)
    {
      console.warn(`⚠️ Game ${gameId} is full - cannot join`);
      await broadcastToGame(gameId, {
        type: 'system.error',
        payload: {
          message: 'Game is full',
          userId,
        },
      });
      return;
    }

    // Add player to session
    const racerPlayer: RacerPlayer = {
      userId,
      username,
      podId: null,
      podConfig: null,
      isReady: false,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: 0,
      currentLap: 1,
      lastCheckpoint: -1,
      checkpointsHit: [],
      lapTimes: [],
      racePosition: session.players.size + 1,
      isFinished: false,
      lastPositionUpdate: Date.now(),
    };

    // Store in session metadata
    if (!session.game.metadata)
    {
      session.game.metadata = {};
    }
    if (!session.game.metadata.racerPlayers)
    {
      session.game.metadata.racerPlayers = new Map();
    }
    session.game.metadata.racerPlayers.set(userId, racerPlayer);

    console.log(`🏎️ Player ${username} joined racer game ${gameId} (${session.players.size}/${session.game.maxPlayers})`);

    // Broadcast player joined to all clients
    await broadcastToGame(gameId, {
      type: 'racer:player_joined',
      payload: {
        userId,
        username,
        playerCount: session.players.size,
        maxPlayers: session.game.maxPlayers,
      },
    });
  }
  catch (error)
  {
    console.error('❌ Error in handleRacerJoin:', error);
  }
}

/**
 * Handle racer:leave event
 */
export async function handleRacerLeave(data: any): Promise<void>
{
  try
  {
    const { gameId, userId, username } = data.payload;

    const session = sessionStore.get(gameId);
    if (!session)
    {
      return;
    }

    // Remove player
    if (session.game.metadata?.racerPlayers)
    {
      session.game.metadata.racerPlayers.delete(userId);
    }

    console.log(`🏃 Player ${username} left racer game ${gameId}`);

    // Broadcast player left
    await broadcastToGame(gameId, {
      type: 'racer:player_left',
      payload: {
        userId,
        username,
        playerCount: session.players.size,
      },
    });

    // If too few players, cancel game
    if (session.players.size < session.game.minPlayers && session.game.status === GameStatus.WAITING)
    {
      await cancelRacerGame(gameId);
    }
  }
  catch (error)
  {
    console.error('❌ Error in handleRacerLeave:', error);
  }
}

/**
 * Handle racer:pod_selected event
 */
export async function handlePodSelection(data: any): Promise<void>
{
  try
  {
    const { gameId, userId, username, podId, podConfig } = data.payload;

    const session = sessionStore.get(gameId);
    if (!session || !session.game.metadata?.racerPlayers)
    {
      return;
    }

    const player = session.game.metadata.racerPlayers.get(userId);
    if (!player)
    {
      console.warn(`⚠️ Player ${userId} not found in racer game ${gameId}`);
      return;
    }

    // Update pod selection
    player.podId = podId;
    player.podConfig = podConfig;

    console.log(`🛸 Player ${username} selected pod ${podId} in game ${gameId}`);

    // Broadcast pod selection to all clients
    await broadcastToGame(gameId, {
      type: 'racer:pod_updated',
      payload: {
        userId,
        username,
        podId,
        podConfig,
      },
    });
  }
  catch (error)
  {
    console.error('❌ Error in handlePodSelection:', error);
  }
}

/**
 * Handle racer:ready event
 */
export async function handlePlayerReady(data: any): Promise<void>
{
  try
  {
    const { gameId, userId, username, ready } = data.payload;

    const session = sessionStore.get(gameId);
    if (!session || !session.game.metadata?.racerPlayers)
    {
      return;
    }

    const player = session.game.metadata.racerPlayers.get(userId);
    if (!player)
    {
      return;
    }

    // Update ready status
    player.isReady = ready;

    console.log(`${ready ? '✅' : '❌'} Player ${username} ready status: ${ready} in game ${gameId}`);

    // Broadcast ready status
    await broadcastToGame(gameId, {
      type: 'racer:player_ready',
      payload: {
        userId,
        username,
        ready,
      },
    });

    // Check if all players are ready
    const allReady = (Array.from(session.game.metadata.racerPlayers.values()) as RacerPlayer[])
      .every(p => p.isReady);
    const enoughPlayers = session.game.metadata.racerPlayers.size >= session.game.minPlayers;

    if (allReady && enoughPlayers)
    {
      await startRacerGame(gameId);
    }
  }
  catch (error)
  {
    console.error('❌ Error in handlePlayerReady:', error);
  }
}

/**
 * Start the racer game with countdown
 */
async function startRacerGame(gameId: string): Promise<void>
{
  try
  {
    const session = sessionStore.get(gameId);
    if (!session)
    {
      return;
    }

    // Update game status
    await gameRepository.startGame(gameId);
    session.game.status = GameStatus.STARTING;

    console.log(`🏁 Starting racer game ${gameId} with countdown`);

    // Send countdown: 3... 2... 1... GO!
    await broadcastToGame(gameId, {
      type: 'racer:game_starting',
      payload: {
        countdown: 3,
        message: 'Race starting in 3 seconds...',
      },
    });

    // Wait and send final start
    setTimeout(async () =>
    {
      session.game.status = GameStatus.PLAYING;
      session.isRunning = true;

      await broadcastToGame(gameId, {
        type: 'racer:race_started',
        payload: {
          message: 'GO!',
          startTime: Date.now(),
        },
      });

      console.log(`🏎️ Racer game ${gameId} started - players racing!`);
    }, 3000);
  }
  catch (error)
  {
    console.error('❌ Error starting racer game:', error);
  }
}

/**
 * Handle racer:position event with validation
 */
export async function handlePositionUpdate(data: any): Promise<void>
{
  try
  {
    const { gameId, userId, position, velocity, rotation } = data.payload;

    const session = sessionStore.get(gameId);
    if (!session || !session.game.metadata?.racerPlayers || !session.isRunning)
    {
      return;
    }

    const player = session.game.metadata.racerPlayers.get(userId);
    if (!player)
    {
      return;
    }

    // Rate limiting - prevent spam
    const now = Date.now();
    if (now - player.lastPositionUpdate < VALIDATION.POSITION_UPDATE_RATE)
    {
      return; // Too fast, ignore
    }

    // Validate position change (anti-teleport)
    const distance = Math.sqrt(
      Math.pow(position.x - player.position.x, 2) +
      Math.pow(position.y - player.position.y, 2) +
      Math.pow(position.z - player.position.z, 2)
    );

    const timeDelta = (now - player.lastPositionUpdate) / 1000; // seconds
    const maxDistance = VALIDATION.MAX_POSITION_DELTA * timeDelta;

    if (distance > maxDistance)
    {
      console.warn(`⚠️ Suspicious position update from ${userId} - teleport detected: ${distance.toFixed(2)} > ${maxDistance.toFixed(2)}`);
      return; // Reject teleport
    }

    // Validate speed
    const speed = Math.sqrt(
      Math.pow(velocity.x, 2) +
      Math.pow(velocity.y, 2) +
      Math.pow(velocity.z, 2)
    );

    const podMaxSpeed = player.podConfig?.maxSpeed || VALIDATION.MAX_SPEED;
    const maxAllowedSpeed = podMaxSpeed * VALIDATION.SPEED_TOLERANCE;

    if (speed > maxAllowedSpeed)
    {
      console.warn(`⚠️ Suspicious speed from ${userId}: ${speed.toFixed(2)} > ${maxAllowedSpeed.toFixed(2)}`);
      // Allow but log for anti-cheat analysis
    }

    // Update player state
    player.position = position;
    player.velocity = velocity;
    player.rotation = rotation;
    player.lastPositionUpdate = now;

    // Broadcast positions to all players (aggregate to reduce messages)
    // Note: In production, you might batch these updates
    const allPositions = (Array.from(session.game.metadata.racerPlayers.values()) as RacerPlayer[]).map(p => ({
      userId: p.userId,
      position: p.position,
      velocity: p.velocity,
      rotation: p.rotation,
    }));

    await broadcastToGame(gameId, {
      type: 'racer:positions',
      payload: {
        positions: allPositions,
        timestamp: now,
      },
    });
  }
  catch (error)
  {
    // Silently ignore position update errors (too frequent)
  }
}

/**
 * Handle racer:checkpoint event with validation
 */
export async function handleCheckpointHit(data: any): Promise<void>
{
  try
  {
    const { gameId, userId, username, checkpointId } = data.payload;

    const session = sessionStore.get(gameId);
    if (!session || !session.game.metadata?.racerPlayers || !session.isRunning)
    {
      return;
    }

    const player = session.game.metadata.racerPlayers.get(userId);
    if (!player || player.isFinished)
    {
      return;
    }

    // Validate checkpoint sequence
    const expectedCheckpoint = player.lastCheckpoint + 1;
    const checkpointCount = session.state.racer?.checkpoints.length || 8;
    const normalizedExpected = expectedCheckpoint % checkpointCount;

    if (checkpointId !== normalizedExpected)
    {
      console.warn(`⚠️ Invalid checkpoint sequence from ${username}: got ${checkpointId}, expected ${normalizedExpected}`);
      await broadcastToGame(gameId, {
        type: 'system.error',
        payload: {
          message: 'Invalid checkpoint sequence',
          userId,
        },
      });
      return;
    }

    // Validate distance to checkpoint
    const checkpoint = session.state.racer?.checkpoints[checkpointId];
    if (checkpoint)
    {
      const distance = Math.sqrt(
        Math.pow(player.position.x - checkpoint.x, 2) +
        Math.pow(player.position.y - checkpoint.y, 2) +
        Math.pow(player.position.z - checkpoint.z, 2)
      );

      if (distance > checkpoint.radius * 2) // Allow some tolerance
      {
        console.warn(`⚠️ Player ${username} too far from checkpoint ${checkpointId}: ${distance.toFixed(2)} > ${checkpoint.radius * 2}`);
        return; // Reject if too far
      }
    }

    // Valid checkpoint hit
    player.lastCheckpoint = checkpointId;
    player.checkpointsHit.push(checkpointId);

    console.log(`🎯 Player ${username} hit checkpoint ${checkpointId} in game ${gameId}`);

    // Broadcast checkpoint hit
    await broadcastToGame(gameId, {
      type: 'racer:checkpoint_hit',
      payload: {
        userId,
        username,
        checkpointId,
        nextCheckpoint: (checkpointId + 1) % checkpointCount,
      },
    });
  }
  catch (error)
  {
    console.error('❌ Error in handleCheckpointHit:', error);
  }
}

/**
 * Handle racer:lap_complete event with validation
 */
export async function handleLapComplete(data: any): Promise<void>
{
  try
  {
    const { gameId, userId, username, lapNumber, lapTime } = data.payload;

    const session = sessionStore.get(gameId);
    if (!session || !session.game.metadata?.racerPlayers || !session.isRunning)
    {
      return;
    }

    const player = session.game.metadata.racerPlayers.get(userId);
    if (!player || player.isFinished)
    {
      return;
    }

    // Validate lap number
    if (lapNumber !== player.currentLap)
    {
      console.warn(`⚠️ Invalid lap number from ${username}: got ${lapNumber}, expected ${player.currentLap}`);
      return;
    }

    // Validate all checkpoints were hit
    const checkpointCount = session.state.racer?.checkpoints.length || 8;
    const expectedCheckpointsThisLap = checkpointCount;
    const checkpointsThisLap = player.checkpointsHit.filter(
      (c: number) => c >= (lapNumber - 1) * checkpointCount && c < lapNumber * checkpointCount
    ).length;

    if (checkpointsThisLap < expectedCheckpointsThisLap)
    {
      console.warn(`⚠️ Player ${username} missed checkpoints - ${checkpointsThisLap}/${expectedCheckpointsThisLap}`);
      return;
    }

    // Validate lap time (prevent impossibly fast laps)
    if (lapTime < VALIDATION.MIN_LAP_TIME)
    {
      console.warn(`⚠️ Suspicious lap time from ${username}: ${lapTime}ms (min: ${VALIDATION.MIN_LAP_TIME}ms)`);
      return;
    }

    // Valid lap completion
    player.currentLap++;
    player.lapTimes.push(lapTime);
    player.checkpointsHit = []; // Reset for next lap

    console.log(`🏁 Player ${username} completed lap ${lapNumber} (${(lapTime / 1000).toFixed(2)}s) in game ${gameId}`);

    // Update race positions
    updateRacePositions(session);

    // Broadcast lap completion
    await broadcastToGame(gameId, {
      type: 'racer:lap_completed',
      payload: {
        userId,
        username,
        lapNumber,
        lapTime,
        totalTime: player.lapTimes.reduce((sum: number, t: number) => sum + t, 0),
        currentLap: player.currentLap,
        position: player.racePosition,
      },
    });

    // Check if player finished the race
    const totalLaps = session.game.lapCount || 3;
    if (player.currentLap > totalLaps)
    {
      await handleRaceFinish(gameId, userId, username, player);
    }
  }
  catch (error)
  {
    console.error('❌ Error in handleLapComplete:', error);
  }
}

/**
 * Handle race finish for a player
 */
async function handleRaceFinish(gameId: string, userId: string, username: string, player: RacerPlayer): Promise<void>
{
  try
  {
    player.isFinished = true;
    const totalTime = player.lapTimes.reduce((sum: number, t: number) => sum + t, 0);

    console.log(`🏆 Player ${username} finished race in position ${player.racePosition} (${(totalTime / 1000).toFixed(2)}s)`);

    // Broadcast race finish for this player
    await broadcastToGame(gameId, {
      type: 'racer:race_finished',
      payload: {
        userId,
        username,
        position: player.racePosition,
        totalTime,
        lapTimes: player.lapTimes,
      },
    });

    // Check if all players finished
    const session = sessionStore.get(gameId);
    if (session?.game.metadata?.racerPlayers)
    {
      const allFinished = (Array.from(session.game.metadata.racerPlayers.values()) as RacerPlayer[])
        .every(p => p.isFinished);

      if (allFinished)
      {
        await endRacerGame(gameId);
      }
    }
  }
  catch (error)
  {
    console.error('❌ Error in handleRaceFinish:', error);
  }
}

/**
 * Update race positions based on progress
 */
function updateRacePositions(session: GameSession): void
{
  if (!session.game.metadata?.racerPlayers)
  {
    return;
  }

  // Sort players by: lap (desc), then by checkpoints hit (desc)
  const players = Array.from(session.game.metadata.racerPlayers.values()) as RacerPlayer[];
  players.sort((a, b) =>
  {
    if (a.currentLap !== b.currentLap)
    {
      return b.currentLap - a.currentLap;
    }
    return b.lastCheckpoint - a.lastCheckpoint;
  });

  // Assign positions
  players.forEach((player, index) =>
  {
    player.racePosition = index + 1;
  });
}

/**
 * End the racer game
 */
async function endRacerGame(gameId: string): Promise<void>
{
  try
  {
    const session = sessionStore.get(gameId);
    if (!session)
    {
      return;
    }

    session.isRunning = false;
    await gameRepository.endGame(gameId);

    console.log(`🏁 Racer game ${gameId} ended`);

    // Get final results
    const results = (Array.from(session.game.metadata.racerPlayers.values()) as RacerPlayer[])
      .map(p => ({
        userId: p.userId,
        username: p.username,
        position: p.racePosition,
        totalTime: p.lapTimes.reduce((sum: number, t: number) => sum + t, 0),
        lapTimes: p.lapTimes,
      }))
      .sort((a, b) => a.position - b.position);

    // Broadcast final results
    await broadcastToGame(gameId, {
      type: 'racer:race_ended',
      payload: {
        results,
        winner: results[0],
      },
    });

    // TODO: Save results to database

    // Clean up session after delay
    setTimeout(() =>
    {
      sessionStore.delete(gameId);
    }, 30000); // 30 seconds
  }
  catch (error)
  {
    console.error('❌ Error ending racer game:', error);
  }
}

/**
 * Cancel the racer game
 */
async function cancelRacerGame(gameId: string): Promise<void>
{
  try
  {
    const session = sessionStore.get(gameId);
    if (!session)
    {
      return;
    }

    session.isRunning = false;
    await gameRepository.updateGameStatus(gameId, GameStatus.CANCELLED);

    console.log(`❌ Racer game ${gameId} cancelled - not enough players`);

    await broadcastToGame(gameId, {
      type: 'system.error',
      payload: {
        message: 'Game cancelled - not enough players',
      },
    });

    sessionStore.delete(gameId);
  }
  catch (error)
  {
    console.error('❌ Error cancelling racer game:', error);
  }
}