// Connection pooling
import { ConnectionInfo } from '../types/connection.types';

export class ConnectionPool {
  // Primary lookup: connectionId -> ConnectionInfo
  private connectionsBySocketId: Map<string, ConnectionInfo> = new Map();
  
  // Secondary lookup: userId -> Set of connectionIds
  private connectionsByUserId: Map<string, Set<string>> = new Map();

  /**
   * Add a connection to the pool
   */
  add(connectionInfo: ConnectionInfo): void {
    const { connectionId, userId } = connectionInfo;
    
    // Add to primary map
    this.connectionsBySocketId.set(connectionId, connectionInfo);
    
    // Add to secondary map
    if (!this.connectionsByUserId.has(userId)) {
      this.connectionsByUserId.set(userId, new Set());
    }
    this.connectionsByUserId.get(userId)!.add(connectionId);
  }

  /**
   * Remove a connection from the pool
   */
  remove(connectionId: string): boolean {
    const connection = this.connectionsBySocketId.get(connectionId);
    
    if (!connection) {
      return false;
    }

    const { userId } = connection;
    
    // Remove from primary map
    this.connectionsBySocketId.delete(connectionId);
    
    // Remove from secondary map
    const userConnections = this.connectionsByUserId.get(userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      
      // Clean up empty user set
      if (userConnections.size === 0) {
        this.connectionsByUserId.delete(userId);
      }
    }

    return true;
  }

  /**
   * Get connection by connection ID
   */
  get(connectionId: string): ConnectionInfo | undefined {
    return this.connectionsBySocketId.get(connectionId);
  }

  /**
   * Get all connection IDs for a user
   */
  getByUserId(userId: string): Set<string> {
    return this.connectionsByUserId.get(userId) || new Set();
  }

  /**
   * Get all ConnectionInfo objects for a user
   */
  getConnectionsByUserId(userId: string): ConnectionInfo[] {
    const connectionIds = this.getByUserId(userId);
    const connections: ConnectionInfo[] = [];
    
    for (const connectionId of connectionIds) {
      const connection = this.get(connectionId);
      if (connection) {
        connections.push(connection);
      }
    }
    
    return connections;
  }

  /**
   * Broadcast a message to all connections for a specific user
   */
  broadcastToUser(userId: string, message: any): void {
    const connections = this.getConnectionsByUserId(userId);
    
    for (const connection of connections) {
      try {
        if (connection.socket.readyState === 1) { // WebSocket.OPEN
          connection.socket.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error(`Error broadcasting to connection ${connection.connectionId}:`, error);
        // Remove broken connection
        this.remove(connection.connectionId);
      }
    }
  }

  /**
   * Get all active connections
   */
  getAll(): ConnectionInfo[] {
    return Array.from(this.connectionsBySocketId.values());
  }

  /**
   * Get total number of connections
   */
  size(): number {
    return this.connectionsBySocketId.size;
  }

  /**
   * Check if a connection exists
   */
  has(connectionId: string): boolean {
    return this.connectionsBySocketId.has(connectionId);
  }

  /**
   * Clear all connections (useful for cleanup)
   */
  clear(): void {
    this.connectionsBySocketId.clear();
    this.connectionsByUserId.clear();
  }
}

// Export singleton instance
export const connectionPool = new ConnectionPool();
