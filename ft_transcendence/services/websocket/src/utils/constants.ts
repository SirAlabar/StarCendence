// WebSocket constants

export const WS_PORT = 3005;
export const WS_PATH = '/ws';
export const HEALTH_PATH = '/health';

// Connection timeouts
export const CONNECTION_TIMEOUT = 30000; // 30 seconds
export const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Message types
export const MESSAGE_TYPES = {
  // System messages
  CONNECTION_ACK: 'connection.ack',
  CONNECTION_ERROR: 'connection.error',
  HEARTBEAT: 'system.heartbeat',
  HEARTBEAT_ACK: 'system.heartbeat.ack',
  ERROR: 'system.error',
  
  // Racer events - Client to Server
  RACER_JOIN: 'racer:join',
  RACER_LEAVE: 'racer:leave',
  RACER_POD_SELECTED: 'racer:pod_selected',
  RACER_READY: 'racer:ready',
  RACER_POSITION: 'racer:position',
  RACER_CHECKPOINT: 'racer:checkpoint',
  RACER_LAP_COMPLETE: 'racer:lap_complete',
  RACER_POWERUP: 'racer:powerup',
  RACER_DISCONNECT: 'racer:disconnect',
  
  // Racer events - Server to Client
  RACER_PLAYER_JOINED: 'racer:player_joined',
  RACER_PLAYER_LEFT: 'racer:player_left',
  RACER_POD_UPDATED: 'racer:pod_updated',
  RACER_PLAYER_READY: 'racer:player_ready',
  RACER_GAME_STARTING: 'racer:game_starting',
  RACER_RACE_STARTED: 'racer:race_started',
  RACER_POSITIONS: 'racer:positions',
  RACER_CHECKPOINT_HIT: 'racer:checkpoint_hit',
  RACER_LAP_COMPLETED: 'racer:lap_completed',
  RACER_RACE_FINISHED: 'racer:race_finished',
  RACER_PLAYER_DISCONNECTED: 'racer:player_disconnected',
} as const;