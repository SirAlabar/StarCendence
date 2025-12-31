// WebSocket event handlers for pod racing multiplayer
import { EventManager } from './EventManager';
import { ConnectionInfo, WebSocketMessage } from '../types/connection.types';
import { redisBroadcast } from '../broadcasting/RedisBroadcast';

/**
 * Racer event types handled by WebSocket service
 */
const RACER_EVENTS = [
  'racer:join',
  'racer:leave',
  'racer:pod_selected',
  'racer:ready',
  'racer:position',
  'racer:checkpoint',
  'racer:lap_complete',
  'racer:powerup',
  'racer:disconnect',
];

/**
 * Register all racer event handlers
 */
export function registerRacerEvents(): void
{
  for (const eventType of RACER_EVENTS)
  {
    EventManager.registerHandler(eventType, handleRacerEvent);
  }
  
  console.log('✅ Racer events registered:', RACER_EVENTS);
}

/**
 * Main racer event handler - routes to Redis for Game Service processing
 */
async function handleRacerEvent(
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void>
{
  try
  {
    // Validate message has required fields
    if (!message.type || !message.payload)
    {
      console.warn(`⚠️ Invalid racer message from ${connection.userId}:`, message);
      return;
    }

    // Extract gameId from payload
    const gameId = message.payload.gameId;
    if (!gameId)
    {
      console.warn(`⚠️ Racer message missing gameId from ${connection.userId}`);
      return;
    }

    // Build Redis message with connection metadata
    const redisMessage = {
      type: message.type,
      payload: {
        ...message.payload,
        userId: connection.userId,
        username: connection.username,
        connectionId: connection.connectionId,
      },
      gameId,
      timestamp: message.timestamp || Date.now(),
    };

    // Publish to game-specific input channel
    const channel = `game:${gameId}:input`;
    await redisBroadcast.publishToChannel(channel, redisMessage);

    console.log(`📤 [${message.type}] User ${connection.username} → Redis ${channel}`);
  }
  catch (error)
  {
    console.error(`❌ Error handling racer event ${message.type}:`, error);
  }
}

/**
 * Handle racer:join event
 * Player joins the race lobby
 */
EventManager.registerHandler('racer:join', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId } = message.payload;

    if (!gameId)
    {
      console.warn(`⚠️ racer:join missing gameId from ${connection.userId}`);
      return;
    }

    console.log(`🏎️ Player ${connection.username} joining racer game ${gameId}`);

    // Publish to Redis for Game Service
    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:join',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:join handler:', error);
  }
});

/**
 * Handle racer:leave event
 * Player leaves the race lobby
 */
EventManager.registerHandler('racer:leave', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId } = message.payload;

    if (!gameId)
    {
      return;
    }

    console.log(`🏃 Player ${connection.username} leaving racer game ${gameId}`);

    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:leave',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:leave handler:', error);
  }
});

/**
 * Handle racer:pod_selected event
 * Player selected their pod racer
 */
EventManager.registerHandler('racer:pod_selected', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId, podId, podConfig } = message.payload;

    if (!gameId || !podId)
    {
      console.warn(`⚠️ racer:pod_selected missing required fields from ${connection.userId}`);
      return;
    }

    console.log(`🛸 Player ${connection.username} selected pod ${podId} in game ${gameId}`);

    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:pod_selected',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
        podId,
        podConfig: podConfig || null,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:pod_selected handler:', error);
  }
});

/**
 * Handle racer:ready event
 * Player marked as ready to start
 */
EventManager.registerHandler('racer:ready', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId, ready } = message.payload;

    if (!gameId || typeof ready !== 'boolean')
    {
      console.warn(`⚠️ racer:ready missing required fields from ${connection.userId}`);
      return;
    }

    console.log(`✅ Player ${connection.username} ready status: ${ready} in game ${gameId}`);

    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:ready',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
        ready,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:ready handler:', error);
  }
});

/**
 * Handle racer:position event
 * Player position update during race (sent frequently ~20 FPS)
 */
EventManager.registerHandler('racer:position', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId, position, velocity, rotation } = message.payload;

    if (!gameId || !position)
    {
      return; // Silently ignore invalid position updates
    }

    // Validate position structure
    if (typeof position.x !== 'number' || 
        typeof position.y !== 'number' || 
        typeof position.z !== 'number')
    {
      return;
    }

    // Publish to Redis (Game Service will validate)
    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:position',
      payload: {
        userId: connection.userId,
        gameId,
        position: {
          x: position.x,
          y: position.y,
          z: position.z,
        },
        velocity: velocity || { x: 0, y: 0, z: 0 },
        rotation: rotation || 0,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    // Don't log position update errors (too frequent)
  }
});

/**
 * Handle racer:checkpoint event
 * Player hit a checkpoint
 */
EventManager.registerHandler('racer:checkpoint', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId, checkpointId } = message.payload;

    if (!gameId || typeof checkpointId !== 'number')
    {
      console.warn(`⚠️ racer:checkpoint missing required fields from ${connection.userId}`);
      return;
    }

    console.log(`🎯 Player ${connection.username} hit checkpoint ${checkpointId} in game ${gameId}`);

    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:checkpoint',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
        checkpointId,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:checkpoint handler:', error);
  }
});

/**
 * Handle racer:lap_complete event
 * Player completed a lap
 */
EventManager.registerHandler('racer:lap_complete', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId, lapNumber, lapTime } = message.payload;

    if (!gameId || typeof lapNumber !== 'number' || typeof lapTime !== 'number')
    {
      console.warn(`⚠️ racer:lap_complete missing required fields from ${connection.userId}`);
      return;
    }

    console.log(`🏁 Player ${connection.username} completed lap ${lapNumber} (${lapTime}ms) in game ${gameId}`);

    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:lap_complete',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
        lapNumber,
        lapTime,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:lap_complete handler:', error);
  }
});

/**
 * Handle racer:powerup event
 * Player collected or used a powerup
 */
EventManager.registerHandler('racer:powerup', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId, action, powerupType } = message.payload;

    if (!gameId || !action)
    {
      console.warn(`⚠️ racer:powerup missing required fields from ${connection.userId}`);
      return;
    }

    console.log(`⚡ Player ${connection.username} ${action} powerup ${powerupType} in game ${gameId}`);

    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:powerup',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
        action, // 'collected' or 'used'
        powerupType: powerupType || null,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:powerup handler:', error);
  }
});

/**
 * Handle racer:disconnect event
 * Player disconnected during race
 */
EventManager.registerHandler('racer:disconnect', async (
  message: WebSocketMessage,
  connection: ConnectionInfo
): Promise<void> =>
{
  try
  {
    const { gameId } = message.payload;

    if (!gameId)
    {
      return;
    }

    console.log(`📴 Player ${connection.username} disconnected from racer game ${gameId}`);

    await redisBroadcast.publishToChannel(`game:${gameId}:input`, {
      type: 'racer:disconnect',
      payload: {
        userId: connection.userId,
        username: connection.username,
        gameId,
      },
      timestamp: Date.now(),
    });
  }
  catch (error)
  {
    console.error('❌ Error in racer:disconnect handler:', error);
  }
});