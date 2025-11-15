// WebSocket client manager
import { LoginService } from '../auth/LoginService';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectInterval = 2000; // 2 seconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsUrl: string;

  constructor() {
    // Get WebSocket URL from environment variable
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
  }

  /**
   * Connect to WebSocket server with authentication token
   */
  connect(token: string): void {
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    try {
      this.state = ConnectionState.CONNECTING;
      const url = `${this.wsUrl}?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(url);

      this.setupEventHandlers();
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.state = ConnectionState.DISCONNECTED;
      this.handleReconnect(token);
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      
      // Dispatch connection event
      window.dispatchEvent(new CustomEvent('ws:connected', { detail: {} }));
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Dispatch message as window event for components to listen
        window.dispatchEvent(new CustomEvent(`ws:${message.type}`, { 
          detail: message.payload 
        }));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      window.dispatchEvent(new CustomEvent('ws:error', { 
        detail: { message: 'WebSocket connection error' } 
      }));
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.state = ConnectionState.DISCONNECTED;
      this.socket = null;
      
      window.dispatchEvent(new CustomEvent('ws:disconnected', { detail: {} }));

      // Try to reconnect if we have a token
      const token = LoginService.getAccessToken();
      if (token) {
        this.handleReconnect(token);
      }
    };
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.reconnectAttempts = 0;
      return;
    }

    this.state = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect(token);
    }, this.reconnectInterval);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.state = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
  }

  /**
   * Send a message to the WebSocket server
   */
  send(type: string, payload: any): boolean {
    if (!this.socket || this.state !== ConnectionState.CONNECTED) {
      console.warn('WebSocket is not connected. Cannot send message.');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Reconnect with fresh token
   */
  reconnect(): void {
    const token = LoginService.getAccessToken();
    if (!token) {
      console.warn('No access token available for reconnection');
      return;
    }

    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 100);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && 
           this.socket !== null && 
           this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
