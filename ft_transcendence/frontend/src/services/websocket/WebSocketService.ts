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
      } catch (error) {
      }
    };

    this.socket.onclose = () => {
      this.status = ConnectionStatus.DISCONNECTED;
      this.socket = null;
      this.stopHeartbeat();

      const token = LoginService.getAccessToken();
      if (token) {
        this.handleReconnect();
      }
    };
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
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.reconnectAttempts = 0;
      return;
    }

    this.status = ConnectionStatus.RECONNECTING;
    this.reconnectAttempts++;
    
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.status = ConnectionStatus.DISCONNECTED;
    this.reconnectAttempts = 0;
  }

  /**
   * Send a message to the WebSocket server (generic method)
   */
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
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reconnect with fresh token
   */
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

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED && 
           this.socket !== null && 
           this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get current connection state (alias for getStatus)
   */
  getState(): ConnectionStatus {
    return this.status;
  }

  // ===== Event Listener Infrastructure (Stubs - To be implemented later) =====

  /**
   * Register listener for lobby updates
   * TODO: Implement when lobby events are needed
   */
  onLobbyUpdate(lobbyId: string, callback: (lobby: any) => void): void {
    this.addListener(`lobby:update:${lobbyId}`, callback);
  }

  /**
   * Register listener for player join
   * TODO: Implement when player events are needed
   */
  onPlayerJoin(lobbyId: string, callback: (player: any) => void): void {
    this.addListener(`lobby:player:join:${lobbyId}`, callback);
  }

  /**
   * Register listener for player leave
   * TODO: Implement when player events are needed
   */
  onPlayerLeave(lobbyId: string, callback: (playerId: string) => void): void {
    this.addListener(`lobby:player:leave:${lobbyId}`, callback);
  }

  /**
   * Register listener for invitations
   * TODO: Implement when invitation events are needed
   */
  onInvitationReceived(callback: (invitation: any) => void): void {
    this.addListener('lobby:invitation', callback);
  }

  /**
   * Register listener for chat messages
   * TODO: Implement when chat events are needed
   */
  onChatMessage(lobbyId: string, callback: (message: any) => void): void {
    this.addListener(`lobby:chat:${lobbyId}`, callback);
  }

  /**
   * Subscribe to friend status updates
   * TODO: Implement when friend status events are needed
   */
  subscribeFriendsStatus(callback: (userId: string, status: string) => void): void {
    this.addListener('user:status', callback);
  }

  /**
   * Unsubscribe from friend status updates
   */
  unsubscribeFriendsStatus(): void {
    this.removeListener('user:status', undefined);
  }

  /**
   * Unsubscribe from lobby events
   */
  unsubscribeLobby(lobbyId: string): void {
    this.removeListener(`lobby:update:${lobbyId}`, undefined);
    this.removeListener(`lobby:player:join:${lobbyId}`, undefined);
    this.removeListener(`lobby:player:leave:${lobbyId}`, undefined);
    this.removeListener(`lobby:chat:${lobbyId}`, undefined);
  }

  // ===== Lobby Methods (Stubs - To be implemented later) =====

  /**
   * Create a new lobby
   * TODO: Implement when lobby creation is needed
   */
  async createLobby(_gameType: 'pong' | 'podracer', _maxPlayers: number): Promise<string> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Stub - returns a mock lobby ID
    // TODO: Implement actual lobby creation when needed
    return Promise.resolve(`lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }

  /**
   * Join a lobby
   * TODO: Implement when lobby joining is needed
   */
  async joinLobby(lobbyId: string): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Stub - does nothing for now
    // TODO: Implement actual lobby joining when needed
    this.send('lobby:join', { lobbyId });
  }

  /**
   * Leave a lobby
   * TODO: Implement when lobby leaving is needed
   */
  async leaveLobby(lobbyId: string): Promise<void> {
    // Stub - does nothing for now
    // TODO: Implement actual lobby leaving when needed
    this.send('lobby:leave', { lobbyId });
  }

  /**
   * Send an invitation
   * TODO: Implement when invitations are needed
   */
  async sendInvitation(lobbyId: string, friendUserId: string): Promise<void> {
    // Stub - does nothing for now
    // TODO: Implement actual invitation sending when needed
    this.send('lobby:invite', { lobbyId, friendUserId });
  }

  /**
   * Accept an invitation
   * TODO: Implement when invitations are needed
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    // Stub - does nothing for now
    // TODO: Implement actual invitation acceptance when needed
    this.send('lobby:accept', { invitationId });
  }

  /**
   * Decline an invitation
   * TODO: Implement when invitations are needed
   */
  async declineInvitation(invitationId: string): Promise<void> {
    // Stub - does nothing for now
    // TODO: Implement actual invitation decline when needed
    this.send('lobby:decline', { invitationId });
  }

  /**
   * Update ready status
   * TODO: Implement when ready status is needed
   */
  async updateReadyStatus(lobbyId: string, isReady: boolean): Promise<void> {
    // Stub - does nothing for now
    // TODO: Implement actual ready status update when needed
    this.send('lobby:ready', { lobbyId, isReady });
  }

  /**
   * Update customization
   * TODO: Implement when customization is needed
   */
  async updateCustomization(lobbyId: string, customization: any): Promise<void> {
    // Stub - does nothing for now
    // TODO: Implement actual customization update when needed
    this.send('lobby:customization', { lobbyId, customization });
  }

  /**
   * Send chat message
   * TODO: Implement when chat is needed
   */
  async sendChatMessage(lobbyId: string, message: string): Promise<void> {
    // Stub - does nothing for now
    // TODO: Implement actual chat message sending when needed
    this.send('lobby:chat', { lobbyId, message });
  }

  // ===== Private Listener Management =====

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
}

export const webSocketService = new WebSocketService();
