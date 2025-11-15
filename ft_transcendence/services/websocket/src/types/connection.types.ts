// Connection types
import { WebSocket } from '@fastify/websocket';

export interface ConnectionInfo {
  connectionId: string;
  userId: string;
  username?: string;
  socket: WebSocket;
  connectedAt: Date;
  ip?: string;
  userAgent?: string;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
}

export interface AuthenticatedConnection {
  connectionId: string;
  userId: string;
  socket: WebSocket;
}
