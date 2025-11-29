// WebSocket constants

export const WS_PORT = 3005;
export const WS_PATH = '/ws';
export const HEALTH_PATH = '/health';

// Connection timeouts
export const CONNECTION_TIMEOUT = 30000; // 30 seconds
export const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Message types
export const MESSAGE_TYPES = {
  CONNECTION_ACK: 'connection.ack',
  CONNECTION_ERROR: 'connection.error',
  HEARTBEAT: 'system.heartbeat',
  HEARTBEAT_ACK: 'system.heartbeat.ack',
  ERROR: 'system.error',
} as const;
