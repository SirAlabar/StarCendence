// Connection pooling
import { ConnectionInfo } from '../types/connection.types';

export class ConnectionPool
{
  // Store connections by their ID
  private connectionsBySocketId: Map<string, ConnectionInfo> = new Map();
  
  // Store all connection IDs for each user
  private connectionsByUserId: Map<string, Set<string>> = new Map();

  add(connectionInfo: ConnectionInfo): void
  {
    const { connectionId, userId } = connectionInfo;
    
    // Save connection by ID
    this.connectionsBySocketId.set(connectionId, connectionInfo);
    
    // Save connection ID for this user
    if (!this.connectionsByUserId.has(userId))
    {
      this.connectionsByUserId.set(userId, new Set());
    }
    this.connectionsByUserId.get(userId)!.add(connectionId);
  }

  remove(connectionId: string): boolean
  {
    const connection = this.connectionsBySocketId.get(connectionId);
    
    if (!connection)
    {
      return false;
    }

    const { userId } = connection;
    
    // Remove connection by ID
    this.connectionsBySocketId.delete(connectionId);
    
    // Remove connection ID from user's list
    const userConnections = this.connectionsByUserId.get(userId);
    if (userConnections)
    {
      userConnections.delete(connectionId);
      
      // If user has no more connections, remove the empty list
      if (userConnections.size === 0)
      {
        this.connectionsByUserId.delete(userId);
      }
    }

    return true;
  }

  get(connectionId: string): ConnectionInfo | undefined
  {
    return this.connectionsBySocketId.get(connectionId);
  }

  getByUserId(userId: string): Set<string>
  {
    return this.connectionsByUserId.get(userId) || new Set();
  }

  getConnectionsByUserId(userId: string): ConnectionInfo[]
  {
    const connectionIds = this.getByUserId(userId);
    const connections: ConnectionInfo[] = [];
    
    for (const connectionId of connectionIds)
    {
      const connection = this.get(connectionId);
      if (connection)
      {
        connections.push(connection);
      }
    }
    
    return connections;
  }

  broadcastToUser(userId: string, message: any): void
  {
    const connections = this.getConnectionsByUserId(userId);
    
    for (const connection of connections)
    {
      try
      {
        if (connection.socket.readyState === 1) // WebSocket.OPEN
        {
          connection.socket.send(JSON.stringify(message));
        }
      }
      catch (error)
      {
        console.error(`Error broadcasting to connection ${connection.connectionId}:`, error);
        // Remove connection that's not working
        this.remove(connection.connectionId);
      }
    }
  }

  getAll(): ConnectionInfo[]
  {
    return Array.from(this.connectionsBySocketId.values());
  }

  size(): number
  {
    return this.connectionsBySocketId.size;
  }

  has(connectionId: string): boolean
  {
    return this.connectionsBySocketId.has(connectionId);
  }

  clear(): void
  {
    this.connectionsBySocketId.clear();
    this.connectionsByUserId.clear();
  }

  getConnectedUsersSummary(): { totalConnections: number; users: Array<{ userId: string; username?: string; connectionCount: number }> }
  {
    const usersMap = new Map<string, { username?: string; connectionCount: number }>();

    for (const connection of this.connectionsBySocketId.values())
    {
      const existing = usersMap.get(connection.userId);
      if (existing)
      {
        existing.connectionCount++;
      }
      else
      {
        usersMap.set(connection.userId, {
          username: connection.username,
          connectionCount: 1,
        });
      }
    }

    const users = Array.from(usersMap.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      connectionCount: data.connectionCount,
    }));

    return {
      totalConnections: this.connectionsBySocketId.size,
      users,
    };
  }

  logConnectedUsers(): void
  {
    const summary = this.getConnectedUsersSummary();
    
    if (summary.totalConnections === 0)
    {
      console.log('📊 Connected Users: 0 connections');
      return;
    }

    console.log(`📊 Connected Users: ${summary.totalConnections} connection(s) from ${summary.users.length} user(s)`);
    
    for (const user of summary.users)
    {
      const usernameDisplay = user.username || 'Unknown';
      const connectionText = user.connectionCount > 1 ? 'connections' : 'connection';
      console.log(`   • ${usernameDisplay} (${user.userId.substring(0, 8)}...): ${user.connectionCount} ${connectionText}`);
    }
  }
}

// Export singleton instance
export const connectionPool = new ConnectionPool();
