// WebSocket client manager
import { ConnectionStatus } from '../../types/websocket.types';
import { LoginService } from '../auth/LoginService';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 2000; // 2 seconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsUrl: string;
  private listeners: Map<string, Function[]> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private manualDisconnect: boolean = false;

  constructor() {
    const envUrl = import.meta.env.VITE_WS_URL;
    
    if (envUrl) {
      this.wsUrl = envUrl;
    } else {
      const hostname = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      if (port) {
        this.wsUrl = `${protocol}//${hostname}:${port}/ws`;
      } else {
        const defaultPort = protocol === 'wss:' ? '8443' : '8080';
        this.wsUrl = `${protocol}//${hostname}:${defaultPort}/ws`;
      }
    }
  }

  async connect(): Promise<void> {
    const token = LoginService.getAccessToken();
    if (!token) {
      throw new Error('No access token available for WebSocket connection. Please login first.');
    }

    if (this.status === ConnectionStatus.CONNECTED || this.status === ConnectionStatus.CONNECTING) {
      return;
    }

    this.manualDisconnect = false;

    return new Promise((resolve, reject) => {
      try {
        this.status = ConnectionStatus.CONNECTING;
        const url = `${this.wsUrl}?token=${encodeURIComponent(token)}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.status = ConnectionStatus.CONNECTED;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.socket.onerror = (error) => {
          console.error('[WebSocketService] Connection error:', error);
          this.status = ConnectionStatus.ERROR;
          reject(new Error(`WebSocket connection failed to ${this.wsUrl}`));
        };

        this.setupSocketEventHandlers();
      } catch (error) {
        console.error('[WebSocketService] Failed to create WebSocket:', error);
        this.status = ConnectionStatus.DISCONNECTED;
        reject(error);
        this.handleReconnect();
      }
    });
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'pong' || message.type === 'heartbeat:ack') {
          return;
        }
        window.dispatchEvent(new CustomEvent(`ws:${message.type}`, { 
          detail: message.payload 
        }));
        this.emit(message.type, message.payload);
      } catch (error) {}
    };

    this.socket.onclose = (event) => {
      this.status = ConnectionStatus.DISCONNECTED;
      this.socket = null;
      this.stopHeartbeat();

      // Handle close codes for reconnection logic
      const closeCode = event && typeof event.code === 'number' ? event.code : 1006;
      if (this.shouldReconnect(closeCode)) {
        this.handleReconnect();
      }
    };
  }

  /**
   * Decide if should reconnect based on close code and token
   */
  private shouldReconnect(closeCode: number): boolean {
    // Never reconnect if no auth token
    const token = LoginService.getAccessToken();
    if (!token) {
      return false;
    }
    // Standard WebSocket close codes
    // 1000: Normal closure
    // 1001: Going away (browser closing, navigation)
    // 1006: Abnormal closure (network issue, server crash)
    // 4001: Custom - Authentication failed
    // 4003: Custom - Token expired
    switch (closeCode) {
      case 1000: // Normal closure
      case 1001: // Going away
      case 4001: // Authentication failed
      case 4003: // Token expired
        return false;
      case 1006: // Abnormal closure (network issue)
        return true;
      default:
        // For unknown codes, attempt reconnect if we have a token
        return true;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.status === ConnectionStatus.CONNECTED) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          // Connection may be closed
        }
      }
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    // Don't reconnect if manual disconnect or no token
    if (this.manualDisconnect || !LoginService.getAccessToken()) {
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocketService] ⛔ Max reconnection attempts reached');
      this.reconnectAttempts = 0;
      return;
    }
    this.status = ConnectionStatus.RECONNECTING;
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.warn('[WebSocketService] ⚠️ Reconnect failed:', error && error.message);
      });
    }, delay);
  }


  disconnect(): void {
    // Mark as manual disconnect BEFORE closing
    this.manualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.socket) {
      try {
        // Use close code 1000 for normal closure
        this.socket.close(1000, 'Client disconnect');
      } catch (error) {
        console.error('[WebSocketService] ❌ Error closing socket:', error);
      }
      this.socket = null;
    }
    this.status = ConnectionStatus.DISCONNECTED;
    this.reconnectAttempts = 0;
  }


  send(type: string, payload: any): boolean {
    if (!this.socket || this.status !== ConnectionStatus.CONNECTED) {
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      this.socket.send(JSON.stringify(message));
      console.log(message);
      
      return true;

    } catch (error) {
      return false;
    }
  }

  reconnect(): void {
    const token = LoginService.getAccessToken();
    if (!token) {
      return;
    }

    this.disconnect();
    setTimeout(() => {
      this.connect().catch(() => {});
    }, 100);
  }


  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED && 
           this.socket !== null && 
           this.socket.readyState === WebSocket.OPEN;
  }


  getStatus(): ConnectionStatus {
    return this.status;
  }

  getState(): ConnectionStatus {
    return this.status;
  }


  
  private addListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private removeListener(event: string, callback?: Function): void {
    if (callback) {
      // Remove specific callback
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      // Remove all callbacks for event
      this.listeners.delete(event);
    }
  }

  /**
   * Register a listener for all events (wildcard)
   */
  on(event: '*' | string, callback: Function): void {
    if (event === '*') {
      // For wildcard, add to all events as we emit them
      this.addListener('*', callback);
    } else {
      this.addListener(event, callback);
    }
  }

  /**
   * Remove a listener for an event
   */
  off(event: '*' | string, callback: Function): void {
    this.removeListener(event, callback);
  }

  private emit(event: string, data: any): void {
    // Emit to wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(cb => {
        try {
          cb({ type: event, payload: data });
        } catch (error) {
          // Silently handle callback errors
        }
      });
    }

    // Emit to specific event listeners
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          // Silently handle listener errors
        }
      });
    }
  }

  /**
   * Subscribe to friend status updates
   */
  subscribeFriendsStatus(callback: (userId: string, status: string) => void): void {
    this.on('friend:status', (data: any) => {
      callback(data.userId, data.status);
    });
  }

  /**
   * Unsubscribe from friend status updates
   */
  unsubscribeFriendsStatus(): void {
    this.removeListener('friend:status');
  }
}

export const webSocketService = new WebSocketService();